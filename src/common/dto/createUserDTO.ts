import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class CreateDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}
export class EditDto {
  @IsString()
  fullName: string;
  @IsEmail()
  email: string;
  @IsString()
  avatar: string;
}
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
