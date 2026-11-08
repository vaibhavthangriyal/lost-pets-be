import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RequestOtpDto { @IsEmail() @MaxLength(254) email: string; }
export class VerifyOtpDto extends RequestOtpDto {
  @IsString() @Matches(/^\d{6}$/) code: string;
  @IsString() @Length(1, 80) displayName: string;
}
