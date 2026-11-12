import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { postTypes } from '../../pets/entities/pet-post.entity';
import { Point, PointSchema } from '../../pets/entities/point.entity';

@Schema({ timestamps: true, collection: 'notificationLocations' })
export class NotificationLocation {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) user: Types.ObjectId;
  @Prop({ required: true, maxlength: 80, trim: true }) name: string;
  @Prop({ type: PointSchema, required: true }) location: Point;
  @Prop({ required: true, min: 1, max: 100, default: 5 }) radiusKm: number;
  @Prop({ type: [String], enum: postTypes, default: postTypes }) types: string[];
  @Prop({ default: true }) active: boolean;
}
export const NotificationLocationSchema = SchemaFactory.createForClass(NotificationLocation);
NotificationLocationSchema.index({ location: '2dsphere' });
