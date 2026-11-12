import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { PetPost } from '../../pets/entities/pet-post.entity';
import { NotificationLocation } from './notification-location.entity';

@Schema({ timestamps: true, collection: 'notifications' })
export class AppNotification {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: PetPost.name, required: true }) post: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: NotificationLocation.name, required: true }) matchedLocation: Types.ObjectId;
  @Prop({ required: true, default: 'nearby_post' }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) body: string;
  @Prop() readAt?: Date;
  @Prop() openedAt?: Date;
}
export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);
AppNotificationSchema.index({ user: 1, post: 1, type: 1 }, { unique: true });
AppNotificationSchema.index({ user: 1, createdAt: -1 });
