import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomInt } from 'crypto';
import { Types } from 'mongoose';
import { UpdateProfileDto } from '../dto/profile.dto';
import { VerifyOtpDto } from '../dto/otp.dto';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthService {
  constructor(private repository: AuthRepository, private jwt: JwtService) { }
  private digest(email: string, code: string) {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new ServiceUnavailableException('OTP_SECRET is not configured');
    return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
  }
  async requestCode(rawEmail: string) {
    if (process.env.NODE_ENV === 'production' || process.env.OTP_DELIVERY !== 'console') throw new ServiceUnavailableException('OTP delivery is not configured');
    const email = rawEmail.trim().toLowerCase();
    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    await this.repository.saveChallenge(email, this.digest(email, code), new Date(Date.now() + 5 * 60000));
    console.log(`[development OTP] ${email}: ${code}`);
    return { message: 'If delivery is available, a code has been sent.' };
  }
  async verify(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const challenge = await this.repository.attemptChallenge(email);
    if (!challenge || challenge.digest !== this.digest(email, dto.code)) throw new UnauthorizedException('Invalid or expired code');
    const consumed = await this.repository.consumeChallenge(challenge._id, challenge.digest);
    if (!consumed.deletedCount) throw new UnauthorizedException('Invalid or expired code');
    const displayName = dto.displayName.trim();
    if (!displayName) throw new BadRequestException('Display name cannot be blank');
    const user = await this.repository.findOrCreateUser(email, displayName);
    return { accessToken: await this.jwt.signAsync({ sub: user._id.toString() }), user: { id: user._id, displayName: user.displayName } };
  }
  private userId(value: string) { if (!Types.ObjectId.isValid(value)) throw new UnauthorizedException(); return new Types.ObjectId(value); }
  async profile(userId: string) {
    const user = await this.repository.findUser(this.userId(userId));
    if (!user) throw new UnauthorizedException();
    return { id: user._id, displayName: user.displayName, email: user.email };
  }
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const displayName = dto.displayName.trim();
    if (!displayName) throw new BadRequestException('Display name cannot be blank');
    const user = await this.repository.updateDisplayName(this.userId(userId), displayName);
    if (!user) throw new UnauthorizedException();
    return { id: user._id, displayName: user.displayName, email: user.email };
  }
}
