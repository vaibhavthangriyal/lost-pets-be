import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'metaMaster', timestamps: true })
export class MetaMaster {
  @Prop({ required: true, unique: true, trim: true }) key: string;
  @Prop({ required: true, trim: true }) label: string;
  @Prop({ default: true, required: true }) active: boolean;
}
export const MetaMasterSchema = SchemaFactory.createForClass(MetaMaster);
