import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AppNotification, AppNotificationSchema } from './entities/app-notification.entity';
import { NotificationLocation, NotificationLocationSchema } from './entities/notification-location.entity';
import { PushDevice, PushDeviceSchema } from './entities/push-device.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushNotificationService } from './push/expo-push-notification.service';
import { PUSH_NOTIFICATION_SERVICE } from './push/push-notification.service';
import { NotificationGateway } from './socket/notification.gateway';
import { SocketNotificationService } from './socket/socket-notification.service';

@Module({ imports: [AuthModule, MongooseModule.forFeature([{ name: NotificationLocation.name, schema: NotificationLocationSchema }, { name: AppNotification.name, schema: AppNotificationSchema }, { name: PushDevice.name, schema: PushDeviceSchema }])], controllers: [NotificationsController], providers: [NotificationsService, NotificationGateway, SocketNotificationService, { provide: PUSH_NOTIFICATION_SERVICE, useClass: ExpoPushNotificationService }], exports: [NotificationsService, SocketNotificationService] })
export class NotificationsModule {}
