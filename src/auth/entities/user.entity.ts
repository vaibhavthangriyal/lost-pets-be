import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true }) email?: string;
  @Prop({ unique: true, sparse: true, trim: true }) phoneNumber?: string;
  @Prop({ required: true, maxlength: 80 }) displayName: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
