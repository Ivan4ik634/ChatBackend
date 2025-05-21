import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { LinkPreviewData } from 'src/@types/LinkPreview';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ required: false })
  text: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', required: false })
  replyToMessage: Types.ObjectId;

  @Prop({ required: false })
  voise: [string];

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: [] })
  reactions: { user: Types.ObjectId; reaction: string }[];

  @Prop({ default: false })
  isEdit: boolean;

  @Prop({ required: false })
  photos: [string];

  @Prop({ default: Date.now })
  createdAt: Date;
  @Prop()
  _id: mongoose.Schema.Types.ObjectId;
}
export const MessageSchema = SchemaFactory.createForClass(Message);
