import { IsString } from 'class-validator';

export class IUser {
  @IsString()
  _id: string;
  @IsString()
  fullName: string;
  @IsString()
  email: string;
  @IsString()
  password: string;
  @IsString()
  pinnedChatId: string[];
  BlocedUsers: any[];
  RefreshToken: any[];
  @IsString()
  ips: string[];
}
