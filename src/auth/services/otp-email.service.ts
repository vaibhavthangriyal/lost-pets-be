import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SERVICE, EmailService } from './email.service';
import { OtpDeliveryService } from './otp-delivery';

@Injectable()
export class OtpEmailService implements OtpDeliveryService {
  readonly channel = 'email' as const;
  constructor(@Inject(EMAIL_SERVICE) private readonly email: EmailService) {}

  sendOtp(destination: string, code: string) {
    return this.email.send({
      to: destination,
      subject: 'Your Pawprint verification code',
      text: `Your Pawprint verification code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your Pawprint verification code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });
  }
}
