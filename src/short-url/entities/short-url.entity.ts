import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class ShortUrl {
  @Prop({ required: true, unique: true, index: true, minlength: 6, maxlength: 20 }) code: string;
  @Prop({ type: Types.ObjectId, ref: 'PetPost', required: true, unique: true, index: true }) post: Types.ObjectId;
}

export const ShortUrlSchema = SchemaFactory.createForClass(ShortUrl);
