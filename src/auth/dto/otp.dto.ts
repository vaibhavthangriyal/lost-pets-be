import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { OtpChannel } from '../services/otp-delivery';

export class RequestOtpDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phoneNumber must use E.164 format, for example +14155552671' }) phoneNumber?: string;
  @IsOptional() @IsEnum(['email', 'sms']) channel?: OtpChannel;
}
export class VerifyOtpDto extends RequestOtpDto {
  @IsString() @Matches(/^\d{6}$/) code: string;
  @IsString() @Length(1, 80) displayName: string;
}
