import { Types } from 'mongoose';
import { PushNotificationService } from './push/push-notification.service';
import { NotificationsService } from './notifications.service';
import { SocketNotificationService } from './socket/socket-notification.service';

describe('NotificationsService', () => {
  it('creates one in-app notification and push per matching user', async () => {
    const user = new Types.ObjectId(); const post = new Types.ObjectId(); const first = new Types.ObjectId(); const second = new Types.ObjectId();
    const locations = { aggregate: jest.fn().mockResolvedValue([{ _id: first, user, name: 'Home', distanceMeters: 1000 }, { _id: second, user, name: 'Work', distanceMeters: 2000 }]) };
    const notifications = { findOneAndUpdate: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }) };
    const devices = { find: jest.fn().mockResolvedValue([{ pushToken: 'ExponentPushToken[test]' }]), updateMany: jest.fn() };
    const push = { send: jest.fn().mockResolvedValue({ invalidTokens: [] }) }; const socket = { sendToUser: jest.fn() };
    const service = new NotificationsService(locations as any, notifications as any, devices as any, push as PushNotificationService, socket as unknown as SocketNotificationService);
    await service.postCreated({ _id: post, title: 'Missing dog', type: 'lost', location: { type: 'Point', coordinates: [78, 30] } }, new Types.ObjectId().toString());
    expect(notifications.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(devices.find).toHaveBeenCalledTimes(1);
    expect(push.send).toHaveBeenCalledWith(['ExponentPushToken[test]'], expect.objectContaining({ data: expect.objectContaining({ postId: post.toString() }) }));
    expect(socket.sendToUser).toHaveBeenCalledWith(user.toString(), expect.objectContaining({ post: post.toString(), type: 'nearby_post' }));
  });
  it('automatically saves a default location and reuses a nearby one', async () => {
    const user = new Types.ObjectId(); const existing = { _id: new Types.ObjectId(), name: 'Current location' };
    const locations = { findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(existing), countDocuments: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }) };
    const service = new NotificationsService(locations as any, {} as any, {} as any, { send: jest.fn() } as unknown as PushNotificationService, { sendToUser: jest.fn() } as unknown as SocketNotificationService);
    await service.saveAutomaticLocation(user.toString(), { latitude: 30, longitude: 78 }, 'account');
    expect(locations.create).toHaveBeenCalledWith(expect.objectContaining({ user, name: 'Current location', radiusKm: 5, types: ['lost', 'sighting', 'rescue'], active: true }));
    await expect(service.saveAutomaticLocation(user.toString(), { latitude: 30, longitude: 78 }, 'account')).resolves.toBe(existing);
    expect(locations.create).toHaveBeenCalledTimes(1);
  });
});
