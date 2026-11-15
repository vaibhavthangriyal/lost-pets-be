import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class OtpChallenge {
  @Prop({ required: true, unique: true }) identifier: string;
  @Prop({ required: true, enum: ['email', 'sms'] }) channel: 'email' | 'sms';
  @Prop({ required: true }) digest: string;
  @Prop({ required: true, index: { expires: 0 } }) expiresAt: Date;
  @Prop({ default: 0 }) attempts: number;
}
export const OtpSchema = SchemaFactory.createForClass(OtpChallenge);
