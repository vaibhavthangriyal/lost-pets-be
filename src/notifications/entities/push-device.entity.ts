import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../auth/entities/user.entity';

@Schema({ timestamps: true, collection: 'pushDevices' })
export class PushDevice {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true }) user: Types.ObjectId;
  @Prop({ required: true, maxlength: 200 }) deviceId: string;
  @Prop({ required: true, enum: ['android', 'ios'] }) platform: string;
  @Prop({ required: true, unique: true, maxlength: 500 }) pushToken: string;
  @Prop({ default: true }) enabled: boolean;
  @Prop({ default: 0 }) failureCount: number;
  @Prop({ default: Date.now }) lastSeenAt: Date;
}
export const PushDeviceSchema = SchemaFactory.createForClass(PushDevice);
PushDeviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });
