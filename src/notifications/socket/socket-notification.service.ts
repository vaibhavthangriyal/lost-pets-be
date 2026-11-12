import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

export type RealtimeNotification = { _id: string; post: string; type: string; title: string; body: string; createdAt: string };
@Injectable()
export class SocketNotificationService {
  constructor(private gateway: NotificationGateway) {}
  sendToUser(userId: string, notification: RealtimeNotification) { this.gateway.server.to(this.gateway.room(userId)).emit('notification:new', notification); }
}
