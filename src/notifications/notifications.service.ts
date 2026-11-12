import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LocationSettingsDto, PushDeviceDto } from './dto/notifications.dto';
import { AppNotification } from './entities/app-notification.entity';
import { NotificationLocation } from './entities/notification-location.entity';
import { PushDevice } from './entities/push-device.entity';
import { PUSH_NOTIFICATION_SERVICE, PushNotificationService } from './push/push-notification.service';
import { SocketNotificationService } from './socket/socket-notification.service';

function id(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID'); return new Types.ObjectId(value); }
function point(location: { latitude: number; longitude: number }) { return { type: 'Point', coordinates: [location.longitude, location.latitude] }; }
@Injectable()
export class NotificationsService {
  constructor(@InjectModel(NotificationLocation.name) private locations: Model<NotificationLocation>, @InjectModel(AppNotification.name) private notifications: Model<AppNotification>, @InjectModel(PushDevice.name) private devices: Model<PushDevice>, @Inject(PUSH_NOTIFICATION_SERVICE) private push: PushNotificationService, private socket: SocketNotificationService) {}
  listLocations(userId: string) { return this.locations.find({ user: id(userId) }).sort({ createdAt: -1 }); }
  async createLocation(userId: string, dto: LocationSettingsDto) {
    if (await this.locations.countDocuments({ user: id(userId) }) >= 10) throw new BadRequestException('You can save up to 10 locations');
    return this.locations.create({ user: id(userId), name: dto.name.trim(), location: point(dto.location), radiusKm: dto.radiusKm, types: dto.types, active: dto.active ?? true });
  }
  async saveAutomaticLocation(userId: string, location: { latitude: number; longitude: number }, source: 'account' | 'post' = 'account') {
    const user = id(userId); const geoPoint = point(location);
    const nearby = await this.locations.findOne({ user, location: { $near: { $geometry: geoPoint, $maxDistance: 100 } } });
    if (nearby) return nearby;
    if (await this.locations.countDocuments({ user }) >= 10) return null;
    return this.locations.create({ user, name: source === 'post' ? 'Post location' : 'Current location', location: geoPoint, radiusKm: 5, types: ['lost', 'sighting', 'rescue'], active: true });
  }
  async updateLocation(userId: string, locationId: string, dto: LocationSettingsDto) {
    const location = await this.locations.findOneAndUpdate({ _id: id(locationId), user: id(userId) }, { $set: { name: dto.name.trim(), location: point(dto.location), radiusKm: dto.radiusKm, types: dto.types, active: dto.active ?? true } }, { new: true, runValidators: true });
    if (!location) throw new NotFoundException('Location not found'); return location;
  }
  async deleteLocation(userId: string, locationId: string) { const result = await this.locations.deleteOne({ _id: id(locationId), user: id(userId) }); if (!result.deletedCount) throw new NotFoundException('Location not found'); return { deleted: true }; }
  registerDevice(userId: string, dto: PushDeviceDto) { const user = id(userId); return this.devices.findOneAndUpdate({ $or: [{ user, deviceId: dto.deviceId }, { pushToken: dto.pushToken }] }, { $set: { user, deviceId: dto.deviceId, platform: dto.platform, pushToken: dto.pushToken, enabled: true, failureCount: 0, lastSeenAt: new Date() } }, { upsert: true, new: true, runValidators: true }); }
  async removeDevice(userId: string, deviceId: string) { await this.devices.updateOne({ user: id(userId), deviceId }, { $set: { enabled: false } }); return { disabled: true }; }
  list(userId: string, skip = 0, limit = 30) { return this.notifications.find({ user: id(userId) }).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)); }
  async unreadCount(userId: string) { return { count: await this.notifications.countDocuments({ user: id(userId), readAt: { $exists: false } }) }; }
  async open(userId: string, notificationId: string) { const notification = await this.notifications.findOneAndUpdate({ _id: id(notificationId), user: id(userId) }, { $set: { readAt: new Date(), openedAt: new Date() } }, { new: true }); if (!notification) throw new NotFoundException('Notification not found'); return notification; }
  async readAll(userId: string) { await this.notifications.updateMany({ user: id(userId), readAt: { $exists: false } }, { $set: { readAt: new Date() } }); return { read: true }; }
  async postCreated(post: { _id: Types.ObjectId; title: string; type: string; location: { type: 'Point'; coordinates: [number, number] } }, authorId: string) {
    const matches = await this.locations.aggregate<{ _id: Types.ObjectId; user: Types.ObjectId; name: string; distanceMeters: number }>([
      { $geoNear: { near: post.location, distanceField: 'distanceMeters', spherical: true, maxDistance: 100000, query: { active: true, types: post.type, user: { $ne: id(authorId) } } } },
      { $match: { $expr: { $lte: ['$distanceMeters', { $multiply: ['$radiusKm', 1000] }] } } }, { $sort: { distanceMeters: 1 } },
    ]);
    const closest = new Map<string, typeof matches[number]>(); for (const match of matches) if (!closest.has(match.user.toString())) closest.set(match.user.toString(), match);
    for (const match of closest.values()) {
      const title = 'New pet post near you'; const body = `${post.title} was reported within your ${match.name} alert area.`;
      const notification = await this.notifications.findOneAndUpdate({ user: match.user, post: post._id, type: 'nearby_post' }, { $setOnInsert: { matchedLocation: match._id, title, body } }, { upsert: true, new: true });
      const createdAt = new Date((notification as any).createdAt ?? Date.now()).toISOString();
      this.socket.sendToUser(match.user.toString(), { _id: notification._id.toString(), post: post._id.toString(), type: 'nearby_post', title, body, createdAt });
      const devices = await this.devices.find({ user: match.user, enabled: true });
      if (devices.length) void this.push.send(devices.map(device => device.pushToken), { title, body, data: { type: 'nearby_post', postId: post._id.toString(), notificationId: notification._id.toString(), deepLink: `pawprint://posts/${post._id}` } }).then(({ invalidTokens }) => invalidTokens.length ? this.devices.updateMany({ pushToken: { $in: invalidTokens } }, { $set: { enabled: false } }) : undefined).catch(() => undefined);
      void notification;
    }
  }
}
