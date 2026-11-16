import { Module }                  from '@nestjs/common';
import { JwtModule }               from '@nestjs/jwt';
import { MongooseModule }          from '@nestjs/mongoose';
import { AuthController }          from './controllers/auth.controller';
import { OtpChallenge, OtpSchema } from './entities/otp-challenge.entity';
import { User, UserSchema }        from './entities/user.entity';
import { AuthGuard }               from './guards/auth.guard';
import { AuthRepository }          from './repositories/auth.repository';
import { AuthService }             from './services/auth.service';
import { EMAIL_SERVICE }           from './services/email.service';
import { OtpEmailService }         from './services/otp-email.service';
import { SmtpEmailService }        from './services/smtp-email.service';
import { EMAIL_OTP_SERVICE, SMS_OTP_SERVICE } from './services/otp-delivery';
import { TwilioSmsService }        from './services/twilio-sms.service';
import { LoggingService }           from '../logging/logging.service';

@Module({
  imports: 
    [
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: OtpChallenge.name, schema: OtpSchema }]),
      JwtModule.registerAsync({
        useFactory: () => {
          if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');
          return { secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } };
        }
      })],
  controllers: [AuthController],
  providers  : [
    AuthService,
    AuthRepository,
    AuthGuard,
    { provide: EMAIL_SERVICE, useFactory: () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM ? new SmtpEmailService() : null },
    { provide: EMAIL_OTP_SERVICE, useFactory: (email: SmtpEmailService | null) => email ? new OtpEmailService(email) : null, inject: [EMAIL_SERVICE] },
    { provide: SMS_OTP_SERVICE, useFactory: (logger: LoggingService) => process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim() && process.env.TWILIO_FROM_NUMBER?.trim() ? new TwilioSmsService(logger) : null, inject: [LoggingService] },
  ],
  exports    : [AuthGuard, JwtModule],
})
export class AuthModule { }
