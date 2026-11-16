import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Twilio } from 'twilio';
import { OtpDeliveryService }                      from './otp-delivery';
import { LogContext, LoggingService }              from '../../logging/logging.service';

const OTP_CONTENT_VARIABLE_KEY = '1';

@Injectable()
export class TwilioSmsService implements OtpDeliveryService {
  readonly channel = 'sms' as const;
  private readonly client    : Twilio;
  private readonly fromNumber: string;
  private readonly otpContentSid?: string;

  constructor(private readonly logger: LoggingService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken  = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
    if (!accountSid || !authToken || !fromNumber) throw new ServiceUnavailableException('Twilio SMS delivery is not configured');
    this.client     = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
    this.otpContentSid = process.env.TWILIO_OTP_CONTENT_SID?.trim() || undefined;
  }

  async sendOtp(destination: string, code: string, context: LogContext) {
    this.logger.info('Sending OTP through Twilio', context, { destination: this.maskPhone(destination), fromNumber: this.maskPhone(this.fromNumber), template: !!this.otpContentSid });
    try {
      if (this.otpContentSid) {
        try {
          const message = await this.client.messages.create({
            to                : destination,
            from              : this.fromNumber,
            contentSid        : this.otpContentSid,
            contentVariables  : JSON.stringify({ [OTP_CONTENT_VARIABLE_KEY]: code }),
          });
          this.logger.info('Twilio accepted OTP SMS (template)', context, { messageSid: message.sid, providerStatus: message.status });
          return;
        } catch (templateError) {
          this.logger.warn('Twilio template OTP failed, falling back to plain body', context, { error: templateError instanceof Error ? templateError.message : String(templateError) });
        }
      }
      const message = await this.client.messages.create({
        to  : destination,
        from: this.fromNumber,
        body: `Your verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
      });
      this.logger.info('Twilio accepted OTP SMS (plain)', context, { messageSid: message.sid, providerStatus: message.status });
    } catch (error) {
      throw new Error(`Twilio SMS request failed: ${error instanceof Error ? error.message : 'unknown provider error'}`);
    }
  }

  private maskPhone(value: string) {
    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  }
}
