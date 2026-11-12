import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MetaMaster } from './meta-master.entity';

@Schema({ collection: 'metaOptions', timestamps: true })
export class MetaOption {
  @Prop({ type: Types.ObjectId, ref: MetaMaster.name, required: true, index: true }) master: Types.ObjectId;
  @Prop({ required: true, trim: true }) value: string;
  @Prop({ required: true, trim: true }) label: string;
  @Prop({ type: Types.ObjectId, ref: 'MetaOption', index: true }) parentOption?: Types.ObjectId;
  @Prop({ default: 0 }) sortOrder: number;
  @Prop({ default: true, required: true }) active: boolean;
}
export const MetaOptionSchema = SchemaFactory.createForClass(MetaOption);
MetaOptionSchema.index({ master: 1, value: 1 }, { unique: true });
