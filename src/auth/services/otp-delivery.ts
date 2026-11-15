export type OtpChannel = 'email' | 'sms';

export interface OtpDeliveryService {
  readonly channel: OtpChannel;
  sendOtp(destination: string, code: string): Promise<void>;
}

export const EMAIL_OTP_SERVICE = Symbol('EMAIL_OTP_SERVICE');
export const SMS_OTP_SERVICE = Symbol('SMS_OTP_SERVICE');
