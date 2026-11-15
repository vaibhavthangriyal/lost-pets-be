export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
