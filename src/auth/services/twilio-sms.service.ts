import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OtpDeliveryService } from './otp-delivery';

@Injectable()
export class TwilioSmsService implements OtpDeliveryService {
  readonly channel = 'sms' as const;

  async sendOtp(destination: string, code: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) throw new ServiceUnavailableException('Twilio SMS delivery is not configured');

    const body = new URLSearchParams({
      To: destination,
      From: fromNumber,
      Body: `Your Pawprint verification code is ${code}. It expires in 5 minutes.`,
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) throw new Error(`Twilio SMS request failed with HTTP ${response.status}`);
  }
}
