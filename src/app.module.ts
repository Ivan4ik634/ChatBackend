import { Module } from '@nestjs/common';
import { ChatModule } from './chatSocket/chat.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsModule } from './chats/chats.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { JwtService } from '@nestjs/jwt';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ChatModule,
    UserModule,
    MongooseModule.forRoot(
      'mongodb+srv://admin:wwwwww@chatdb.u1cgn6a.mongodb.net/chatdb?retryWrites=true&w=majority&appName=ChatDВ',
    ),
    ChatsModule,
    FileUploadModule,
    EmailModule,
  ],
  providers: [JwtService],
})
export class AppModule {}
