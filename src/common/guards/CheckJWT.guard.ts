import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization;
    console.log(token);
    if (!token) throw new ForbiddenException('Нет токена');

    let payload;
    try {
      payload = this.jwtService.verify(token.replace(/^Bearer\s+/i, ''), {
        secret: 'secretKAY',
      });
    } catch {
      throw new ForbiddenException('Невалидный токен');
    }

    const user = await this.userModel.findById(
      new Types.ObjectId(payload.user._id),
    );
    if (!user) throw new ForbiddenException('Пользователь не найден');

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      '207.97.227.239';
    if (!user.ips.map((obj) => obj.ip).includes(ip)) {
      req.res.clearCookie('token'); // удаляем токен у клиента
      throw new ForbiddenException('Сессия удалена. Перелогиньтесь.');
    }

    // Всё ок
    req.user = user;
    return true;
  }
}
