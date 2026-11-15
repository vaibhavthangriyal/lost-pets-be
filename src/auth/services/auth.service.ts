import { BadRequestException, Inject, Injectable, Optional, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomInt } from 'crypto';
import { Types } from 'mongoose';
import { UpdateProfileDto } from '../dto/profile.dto';
import { RequestOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { EMAIL_OTP_SERVICE, OtpChannel, OtpDeliveryService, SMS_OTP_SERVICE } from './otp-delivery';

@Injectable()
export class AuthService {
  constructor(private repository: AuthRepository, private jwt: JwtService, @Optional() @Inject(EMAIL_OTP_SERVICE) private emailDelivery: OtpDeliveryService | null, @Optional() @Inject(SMS_OTP_SERVICE) private smsDelivery: OtpDeliveryService | null) { }
  private digest(identifier: string, code: string) {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new ServiceUnavailableException('OTP_SECRET is not configured');
    return createHmac('sha256', secret).update(`${identifier}:${code}`).digest('hex');
  }
  async requestCode(dto: RequestOtpDto) {
    const email = dto.email?.trim().toLowerCase();
    const phoneNumber = dto.phoneNumber?.trim();
    if (!email && !phoneNumber) throw new BadRequestException('Provide an email address or phone number');
    const requestedChannel: OtpChannel = dto.channel ?? (phoneNumber ? 'sms' : 'email');
    const identifier = requestedChannel === 'sms' ? phoneNumber : email;
    if (!identifier) throw new BadRequestException(requestedChannel === 'sms' ? 'A phone number is required for SMS OTP' : 'An email address is required for email OTP');
    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    let channel: OtpChannel = requestedChannel;
    try {
      await this.deliver(channel, identifier, code);
    } catch (error) {
      if (requestedChannel !== 'sms' || !email || !this.emailDelivery) throw new ServiceUnavailableException('OTP delivery is not available');
      channel = 'email';
      await this.deliver(channel, email, code);
    }
    if (process.env.NODE_ENV !== 'production' && process.env.OTP_DELIVERY === 'console') console.log(`[development OTP] ${identifier}: ${code}`);
    await this.repository.saveChallenge(identifier, channel, this.digest(identifier, code), new Date(Date.now() + 5 * 60000));
    return { message: 'If delivery is available, a code has been sent.', channel };
  }
  async verify(dto: VerifyOtpDto) {
    const email = dto.email?.trim().toLowerCase();
    const phoneNumber = dto.phoneNumber?.trim();
    const identifier = dto.channel === 'sms' ? phoneNumber : dto.channel === 'email' ? email : email || phoneNumber;
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
  private async deliver(channel: OtpChannel, destination: string, code: string) {
    const service = channel === 'sms' ? this.smsDelivery : this.emailDelivery;
    if (!service) {
      if (channel === 'email' && process.env.NODE_ENV !== 'production' && process.env.OTP_DELIVERY === 'console') return;
      throw new ServiceUnavailableException(`${channel} OTP delivery is not configured`);
    }
    await service.sendOtp(destination, code);
  }
}
