import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { Point, PointSchema } from './point.entity';

export const postTypes = ['lost', 'sighting', 'rescue'] as const;
export type PostType = typeof postTypes[number];
@Schema({ timestamps: true })
export class PetPost {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true }) author: Types.ObjectId;
  @Prop({ enum: postTypes, required: true }) type: PostType;
  @Prop({ required: true, maxlength: 120 }) title: string;
  @Prop({ required: true, maxlength: 5000 }) description: string;
  @Prop({ maxlength: 80 }) species?: string;
  @Prop({ maxlength: 120 }) breed?: string;
  @Prop({ type: [String], default: [] }) photos: string[];
  @Prop({ type: PointSchema, required: true }) location: Point;
  @Prop({ required: true }) occurredAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'PetPost' }) relatedPost?: Types.ObjectId;
  @Prop({ enum: ['active', 'resolved'], default: 'active' }) status: string;
}
export const PetPostSchema = SchemaFactory.createForClass(PetPost);
PetPostSchema.index({ location: '2dsphere' });
PetPostSchema.index({ createdAt: -1, _id: -1 });
