import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class OtpChallenge {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) digest: string;
  @Prop({ required: true, index: { expires: 0 } }) expiresAt: Date;
  @Prop({ default: 0 }) attempts: number;
}
export const OtpSchema = SchemaFactory.createForClass(OtpChallenge);
