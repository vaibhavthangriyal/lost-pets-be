import { BadRequestException, Inject, Injectable, Optional, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService }                                                                                            from '@nestjs/jwt';
import { createHmac, randomInt }                                                                                 from 'crypto';
import { Types }                                                                                                 from 'mongoose';
import { UpdateProfileDto }                                                                                      from '../dto/profile.dto';
import { RequestOtpDto, VerifyOtpDto }                                                                           from '../dto/otp.dto';
import { AuthRepository }                                                                                        from '../repositories/auth.repository';
import { EMAIL_OTP_SERVICE, OtpChannel, OtpDeliveryService, SMS_OTP_SERVICE }                                    from './otp-delivery';
import { LogContext, LoggingService }                                                                            from '../../logging/logging.service';

@Injectable()
export class AuthService {
  constructor(
    private   repository                                        : AuthRepository,
    private   jwt                                               : JwtService,
    private   logger                                            : LoggingService,
    @Optional() @Inject(EMAIL_OTP_SERVICE) private emailDelivery: OtpDeliveryService | null,
    @Optional() @Inject(SMS_OTP_SERVICE) private smsDelivery    : OtpDeliveryService | null
  ) { }
  private digest(identifier: string, code: string) {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new ServiceUnavailableException('OTP_SECRET is not configured');
    return createHmac('sha256', secret).update(`${identifier}:${code}`).digest('hex');
  }
  async requestCode(dto: RequestOtpDto, context: LogContext) {
    const email       = dto.email?.trim().toLowerCase();
    const phoneNumber = dto.phoneNumber?.trim();
    this.logger.info('OTP request received', context, { requestedChannel: dto.channel ?? 'automatic', hasEmail: Boolean(email), hasPhoneNumber: Boolean(phoneNumber) });
    if (!email && !phoneNumber) {
      this.logger.warn('OTP request rejected because no destination was provided', context);
      throw new BadRequestException('Provide an email address or phone number');
    }
    const requestedChannel: OtpChannel = dto.channel ?? (phoneNumber ? 'sms' : 'email');
    const identifier                   = requestedChannel === 'sms' ? phoneNumber : email;
    if (!identifier) {
      this.logger.warn('OTP request rejected because the selected channel has no destination', context, { channel: requestedChannel });
      throw new BadRequestException(requestedChannel === 'sms' ? 'A phone number is required for SMS OTP' : 'An email address is required for email OTP');
    }
    const code                = randomInt(0, 1000000).toString().padStart(6, '0');
    let   channel: OtpChannel = requestedChannel;
    const deliveryIdentifier = () => channel === 'sms' ? phoneNumber! : email!;
    try {
      this.logger.info('Attempting OTP delivery', context, { channel, destination: this.maskIdentifier(identifier) });
      await this.deliver(channel, identifier, code, context);
    } catch (error) {
      this.logger.error('Primary OTP delivery failed', context, error, { channel, destination: this.maskIdentifier(identifier) });
      if (requestedChannel !== 'sms' || !email || !this.emailDelivery) {
        this.logger.error('OTP request failed because no delivery fallback is available', context, undefined, { channel });
        throw new ServiceUnavailableException('OTP delivery is not available');
      }
      channel = 'email';
      this.logger.warn('Falling back from SMS OTP to email OTP', context, { destination: this.maskIdentifier(email) });
      try {
        await this.deliver(channel, email, code, context);
      } catch (fallbackError) {
        this.logger.error('Fallback email OTP delivery failed', context, fallbackError, { destination: this.maskIdentifier(email) });
        throw new ServiceUnavailableException('OTP delivery is not available');
      }
    }
    try {
      const challengeIdentifier = deliveryIdentifier();
      await this.repository.saveChallenge(challengeIdentifier, channel, this.digest(challengeIdentifier, code), new Date(Date.now() + 5 * 60000));
    } catch (persistenceError) {
      this.logger.error('OTP challenge could not be saved', context, persistenceError, { channel, destination: this.maskIdentifier(deliveryIdentifier()) });
      throw persistenceError;
    }
    this.logger.info('OTP delivered and challenge saved', context, { channel, destination: this.maskIdentifier(deliveryIdentifier()) });
    return { message: 'If delivery is available, a code has been sent.', channel };
  }
  async verify(dto: VerifyOtpDto) {
    const email       = dto.email?.trim().toLowerCase();
    const phoneNumber = dto.phoneNumber?.trim();
    const identifier  = dto.channel === 'sms' ? phoneNumber : dto.channel === 'email' ? email : email || phoneNumber;
    if (!identifier) throw new BadRequestException('Provide the email address or phone number used for the code');
    const challenge = await this.repository.attemptChallenge(identifier);
    if (!challenge || challenge.digest !== this.digest(identifier, dto.code)) throw new UnauthorizedException('Invalid or expired code');
    const consumed = await this.repository.consumeChallenge(challenge._id, challenge.digest);
    if (!consumed.deletedCount) throw new UnauthorizedException('Invalid or expired code');
    const displayName = dto.displayName.trim();
    if (!displayName) throw new BadRequestException('Display name cannot be blank');
    const user = await this.repository.findOrCreateUser({ email, phoneNumber }, displayName);
    if (!user) throw new ServiceUnavailableException('Could not create the user account');
    return { accessToken: await this.jwt.signAsync({ sub: user._id.toString() }), user: { id: user._id, displayName: user.displayName } };
  }
  private userId(value: string) { if (!Types.ObjectId.isValid(value)) throw new UnauthorizedException(); return new Types.ObjectId(value); }
  async profile(userId: string) {
    const user = await this.repository.findUser(this.userId(userId));
    if (!user) throw new UnauthorizedException();
    return { id: user._id, displayName: user.displayName, email: user.email, phoneNumber: user.phoneNumber };
  }
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const displayName = dto.displayName.trim();
    if (!displayName) throw new BadRequestException('Display name cannot be blank');
    const user = await this.repository.updateDisplayName(this.userId(userId), displayName);
    if (!user) throw new UnauthorizedException();
    return { id: user._id, displayName: user.displayName, email: user.email, phoneNumber: user.phoneNumber };
  }
  private async deliver(channel: OtpChannel, destination: string, code: string, context: LogContext) {
    const service = channel === 'sms' ? this.smsDelivery : this.emailDelivery;
    if (!service) {
      if (process.env.NODE_ENV !== 'production' && process.env.OTP_DELIVERY === 'console') {
        this.logger.info('Development OTP generated for console delivery', context, { channel, destination: this.maskIdentifier(destination), otp: code });
        return;
      }
      throw new ServiceUnavailableException(`${channel} OTP delivery is not configured`);
    }
    await service.sendOtp(destination, code, context);
  }

  private maskIdentifier(identifier: string) {
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    }
    return `${identifier.slice(0, 3)}***${identifier.slice(-2)}`;
  }
}
