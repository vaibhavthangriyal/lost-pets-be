import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';
import { PetPost } from './pet-post.entity';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: PetPost.name, required: true, index: true }) post: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: User.name, required: true }) author: Types.ObjectId;
  @Prop({ required: true, maxlength: 2000 }) text: string;
  @Prop({ type: Types.ObjectId, ref: 'Comment', index: true }) parentComment?: Types.ObjectId;
}
export const CommentSchema = SchemaFactory.createForClass(Comment);
