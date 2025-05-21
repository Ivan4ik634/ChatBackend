import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: '' })
  avatar: string;

  @Prop({ required: false, default: false })
  online: boolean;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, default: null })
  phone: string;

  @Prop({ type: Boolean, default: false })
  is2FA: boolean;

  @Prop({ type: String, default: null })
  twoFACode: string;

  @Prop({ default: Date.now })
  twoFACodeExpiresAt: Date;

  @Prop({ required: true })
  ips: { ip: string; os: string; browser: string }[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  pinnedChatId: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  blocedUsersId: Types.ObjectId[];

  @Prop()
  _id: mongoose.Schema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
