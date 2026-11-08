import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequestOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { AUTH_ROUTES } from '../routes/auth.routes';
import { AuthService } from '../services/auth.service';

@Controller(AUTH_ROUTES.base)
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post(AUTH_ROUTES.requestOtp) @Throttle({ default: { limit: 5, ttl: 60000 } }) request(@Body() dto: RequestOtpDto) { return this.auth.requestCode(dto.email); }
  @Post(AUTH_ROUTES.verifyOtp) @Throttle({ default: { limit: 10, ttl: 60000 } }) verify(@Body() dto: VerifyOtpDto) { return this.auth.verify(dto); }
}
