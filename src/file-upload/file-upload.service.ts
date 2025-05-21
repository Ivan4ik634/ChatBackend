import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as multer from 'multer';
import * as streamifier from 'streamifier';
cloudinary.config({
  cloud_name: 'dfycv7biq',
  api_key: '367843177175288',
  api_secret: 'oJP0SrNmqpeVJEYAMwfpHULcX4Q', // Click 'View API Keys' above to copy your API secret
});

@Injectable()
export class FileUploadService {
  private async uploadSingleFile(
    file: multer.File,
    fileType: 'image' | 'audio' = 'image',
  ): Promise<string> {
    const cleanedOriginalName = file.originalname.replace(/[^\x00-\x7F]/g, '');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          allowed_formats:
            fileType === 'audio'
              ? ['mp3', 'ogg', 'wav', 'webm']
              : ['jpg', 'jpeg', 'png'],
          resource_type: fileType === 'audio' ? 'video' : 'image',

          transformation:
            fileType === 'audio'
              ? [
                  {
                    audio_codec: 'mp3',
                  },
                ]
              : '',
        },
        (error, result) => {
          if (error) {
            console.error('Error uploading file to Cloudinary:', error);
            return reject(error);
          }
          //@ts-ignore
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadFiles(files: multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadSingleFile(file));
    return await Promise.all(uploadPromises);
  }
  async uploadAudio(audio: multer.File): Promise<string[]> {
    const uploadPromises = audio.map((file) =>
      this.uploadSingleFile(file, 'audio'),
    );
    return await Promise.all(uploadPromises);
  }
}
