import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';

@Schema({ timestamps: true })
export class OwnedPet {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) owner: Types.ObjectId;
  @Prop({ required: true, maxlength: 80, trim: true }) name: string;
  @Prop({ required: true, maxlength: 80, trim: true }) species: string;
  @Prop({ default: '', maxlength: 120, trim: true }) breed: string;
  @Prop({ default: '', maxlength: 2000, trim: true }) description: string;
  @Prop({ type: [String], default: [] }) photos: string[];
}
export const OwnedPetSchema = SchemaFactory.createForClass(OwnedPet);
