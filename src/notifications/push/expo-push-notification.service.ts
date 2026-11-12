import { Injectable } from '@nestjs/common';
import { PushMessage, PushNotificationService } from './push-notification.service';

@Injectable()
export class ExpoPushNotificationService implements PushNotificationService {
  async send(tokens: string[], message: PushMessage) {
    const invalidTokens: string[] = [];
    for (let offset = 0; offset < tokens.length; offset += 100) {
      const batch = tokens.slice(offset, offset + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' }, body: JSON.stringify(batch.map(to => ({ to, sound: 'default', ...message }))) });
      if (!response.ok) throw new Error(`Expo push request failed with HTTP ${response.status}`);
      const result = await response.json() as { data?: { status: string; details?: { error?: string } }[] };
      result.data?.forEach((ticket, index) => { if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') invalidTokens.push(batch[index]); });
    }
    return { invalidTokens };
  }
}
