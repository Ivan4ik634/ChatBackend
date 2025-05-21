import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;
@Schema()
export class Chat {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participantIds: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId;

  @Prop()
  _id: mongoose.Schema.Types.ObjectId;
}
export const ChatSchema = SchemaFactory.createForClass(Chat);
