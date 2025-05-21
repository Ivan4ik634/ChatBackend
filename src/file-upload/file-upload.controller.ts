import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Delete,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import * as multer from 'multer';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtAuthGuard } from 'src/common/guards/CheckJWT.guard';
import { CurrentUser } from 'src/common/decorators/UserNew';
import { IUser } from 'src/common/dto/IUser';
@Controller('upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post('single')
  @UseInterceptors(FilesInterceptor('files')) // files — имя поля в multipart/form-data
  async upload(@UploadedFiles() files: multer.File[]) {
    console.log(files);
    const urls = await this.fileUploadService.uploadFiles(files);
    return {
      urls, // массив ссылок
    };
  }
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadFileAvatar(
    @UploadedFile() files: multer.File,
    @CurrentUser() user: IUser,
  ) {
    console.log(files);
    const uploadResult = await this.fileUploadService.uploadFiles(files);

    return {
      url: uploadResult[0],
    };
  }
  @Post('voices')
  @UseInterceptors(FileInterceptor('audios'))
  @UseGuards(JwtAuthGuard)
  async uploadVoiseMessage(@UploadedFile() audios: multer.File) {
    console.log([audios]);

    const uploadResult = await this.fileUploadService.uploadAudio([audios]);
    return {
      url: uploadResult[0],
    };
  }
}
