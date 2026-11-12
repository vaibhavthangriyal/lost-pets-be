import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { PetPost } from '../../pets/entities/pet-post.entity';

@Schema({ timestamps: true, collection: 'posters' })
export class Poster {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: PetPost.name, required: true, index: true }) post: Types.ObjectId;
  @Prop({ maxlength: 80, default: 'MISSING PET' }) heading: string;
  @Prop({ maxlength: 120 }) title?: string;
  @Prop({ maxlength: 5000 }) description?: string;
  @Prop({ maxlength: 30 }) mobileNumber?: string;
  @Prop({ min: 0 }) rewardAmount?: number;
  @Prop({ maxlength: 10 }) currency?: string;
}
export const PosterSchema = SchemaFactory.createForClass(Poster);
PosterSchema.index({ user: 1, post: 1 }, { unique: true });
