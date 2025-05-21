import { IsString } from 'class-validator';

export class BodyEmailVerifyToken {
  @IsString()
  token: string;
}
export class BodyEmailRefresh {
  @IsString()
  email: string;
}
