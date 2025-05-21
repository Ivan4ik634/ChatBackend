import { Module } from '@nestjs/common';
import { ChatSocket } from './chat.gateway';
import { User, UserSchema } from 'src/schemas/user.schema';
import { ChatSchema, Chat } from 'src/schemas/chat.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { JwtService } from '@nestjs/jwt';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [ChatSocket, JwtService, FileUploadService],
})
export class ChatModule {}
