import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { User, UserSchema } from 'src/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MulterModule.register(),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [FileUploadService, JwtService],
  controllers: [FileUploadController],
  exports: [FileUploadModule],
})
export class FileUploadModule {}
