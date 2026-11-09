import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';

@Schema({ timestamps: true })
export class UploadedFile {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) owner: Types.ObjectId;
  @Prop({ required: true, unique: true }) key: string;
  @Prop({ required: true, maxlength: 255 }) filename: string;
  @Prop({ required: true, maxlength: 255 }) mimeType: string;
  @Prop({ required: true, min: 1 }) size: number;
  @Prop({ min: 0 }) durationSeconds?: number;
  @Prop({ enum: ['pending', 'uploaded', 'failed'], default: 'pending', required: true }) status: string;
  @Prop({ required: true }) uploadExpiresAt: Date;
  @Prop() generation?: string;
  @Prop() confirmedAt?: Date;
}
export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);
