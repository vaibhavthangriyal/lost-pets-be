import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { postTypes } from './pet-post.entity';
import { Point, PointSchema } from './point.entity';

@Schema({ timestamps: true })
export class AlertPreference {
  @Prop({ type: Types.ObjectId, ref: User.name, unique: true, required: true }) user: Types.ObjectId;
  @Prop({ type: PointSchema, required: true }) location: Point;
  @Prop({ required: true, min: 1, max: 100 }) radiusKm: number;
  @Prop({ type: [String], enum: postTypes, default: postTypes }) types: string[];
}
export const AlertSchema = SchemaFactory.createForClass(AlertPreference);
AlertSchema.index({ location: '2dsphere' });
