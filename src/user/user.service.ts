import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDto, EditDto, LoginDto } from 'src/common/dto/createUserDTO';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/common/dto/IUser';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import * as useragent from 'useragent';
import { EmailService } from 'src/email/email.service';
import {
  BodyEmailRefresh,
  BodyEmailVerifyToken,
} from 'src/common/dto/body.dto';
const geoip = require('geoip-lite');
@Injectable()
export class UserService {
  constructor(
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  async register(dto: CreateDto, ip: string, res, req) {
    const oldUser = await this.userModel.findOne({ email: dto.email });
    if (oldUser) {
      throw new BadRequestException('Вже є такий емайл!');
    }
    const userAgent = req.headers['user-agent'] || '';

    const user = new this.userModel({
      fullName: dto.fullName,
      password: dto.password,
      email: dto.email,
      ips: {
        ip,
        os: useragent.parse(userAgent).os.toString(),
        browser: useragent.parse(userAgent).toAgent(),
      },
      _id: new Types.ObjectId(),
    });
    await user.save();
    const token = await this.jwt.signAsync(
      { user: user },
      { secret: 'secretKAY', expiresIn: '90d' },
    );
    const textEmail: string = `Підтвердіть свої електронну пошту через це посилання:<a href='http://localhost:3000/verify-email?token=${token}'>Посилання підтвердження!</a>  Якщо це не ви, то проігноруєте це повідомлення.`;

    await this.emailService.sendEmail(
      user.email,
      'Підтвердження електронної пошти',
      textEmail,
      textEmail,
    );
    return res.json({ message: 'На емайл повинно прийти повідомлення.' });
  }
  async login(dto: LoginDto, ip: string, res, req) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user)
      return res.json(
        new BadRequestException('Неправильний пароль или логин!'),
      );

    const userAgent = req.headers['user-agent'] || '';

    if (
      !user.ips.some((obj) => obj.ip === ip) ||
      !user.ips.some(
        (obj) => obj.browser === useragent.parse(userAgent).toAgent(),
      )
    ) {
      const addUser = {
        ip: ip,
        os: useragent.parse(userAgent).os.toString(),
        browser: useragent.parse(userAgent).toAgent(),
      };
      await this.userModel.updateOne(
        { email: dto.email },
        { $push: { ips: addUser } },
      );
    }
    const token = await this.jwt.signAsync(
      { user: user },
      { secret: 'secretKAY', expiresIn: '90d' },
    );
    const textEmail: string = `Підтвердіть свої електронну пошту через це посилання:<a href='http://localhost:3000/verify-email?token=${token}'>Посилання підтвердження!</a>  Якщо це не ви, то проігноруєте це повідомлення.`;
    await this.emailService.sendEmail(
      user.email,
      'Підтвердження електронної пошти',
      textEmail,
      textEmail,
    );
    return res.json({ message: 'Email is sent' });
  }
  async EmailVerify(body: BodyEmailVerifyToken) {
    const payload = await this.jwt.verify(body.token, { secret: 'secretKAY' });
    const user = await this.userModel.findById(new Types.ObjectId(payload._id));
    if (!user) {
      return { message: 'Not account or token expired' };
    }

    return { message: 'Email is verified' };
  }
  async profileInfo(user: IUser, userAgent, ip: string) {
    if (user) {
      const userMongoose = await this.userModel
        .findById(new Types.ObjectId(user?._id))
        .populate('blocedUsersId');
      if (!userMongoose) {
        return { message: 'No account' };
      }
      const geos = userMongoose.ips.map((obj) => ({
        geo: geoip.lookup(obj),
        ip: obj,
        os: useragent.parse(userAgent).os.toString() || '',
        browser: useragent.parse(userAgent).toAgent() || '',
      }));
      return {
        user: userMongoose,
        geos,
        ProfileIp: ip,
      };
    }
  }
  async profileUser(id: string) {
    const user = await this.userModel.findById(new Types.ObjectId(id));
    if (user) return user;
    return new BadRequestException(
      'Неправильное айди или в базе данних нету юзера!',
    );
  }
  async blockUser(id: string, user: IUser) {
    try {
      if (!id || !user)
        return new BadRequestException('Айди немає або немає юзера!');
      const userMongoose = await this.userModel.findById(user._id);
      const userBloced = await this.userModel.findById(id);
      if (!userBloced)
        return new BadRequestException(
          'Такого юзера немає, або він видалив акаунт!',
        );
      if (user._id === id)
        return new BadRequestException('Самого себе неможливо заблокувати!');

      if (userMongoose?.blocedUsersId.some((obj) => obj.toString() === id)) {
        return this.userModel.updateOne(
          { _id: user._id },
          { $pull: { blocedUsersId: id } },
        );
      }
      return this.userModel.updateOne(
        { _id: user._id },
        { $push: { blocedUsersId: id } },
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Помилка сервера');
    }
  }
  async FullUsers(query?: { search?: string }) {
    const users: IUser[] = await this.userModel.find();

    if (query?.search) {
      return users.filter((obj: IUser) =>
        //@ts-ignore
        obj.fullName.toLowerCase().includes(query.search.toLowerCase()),
      );
    }

    return users;
  }
  async EditProfile(dto: EditDto, user: IUser) {
    const olduser = await this.userModel.findOne({ email: dto.email });
    const currentUser = await this.userModel.findOne({ _id: user._id });
    if (!currentUser) throw new NotFoundException('Користувача не знайдено!');
    if (olduser) {
      if (currentUser.email === dto.email) {
      }
      return new BadRequestException('Вже є такий емайл!');
    }
    if (!user) return;
    currentUser.fullName = dto.fullName ?? currentUser.fullName;
    currentUser.email = dto.email ?? currentUser.email;
    currentUser.avatar = dto.avatar ?? currentUser.avatar;
    await currentUser.save();

    const userMe = await this.userModel.findOne({ _id: user._id });
    console.log(userMe);
    return { profile: userMe };
  }
  async RefreshSendEmail(body: BodyEmailRefresh) {
    const user = await this.userModel.findOne({ email: body.email });
    if (!user) return { message: 'No account' };
    const token = await this.jwt.signAsync(
      { user: user },
      { secret: 'secretKAY' },
    );
    const textEmail: string = `Підтвердіть свої електронну пошту через це посилання:
    <a href='http://localhost:3000/verify-email?token=${token}'>Посилання підтвердження!</a> 
    Якщо це не ви, то проігноруєте це повідомлення.`;
    await this.emailService.sendEmail(
      user.email,
      'Підтвердження електронної пошти',
      textEmail,
      textEmail,
    );
  }
  async GetSessions(user: IUser) {
    if (user) {
      const userMongoose = await this.userModel
        .findById(new Types.ObjectId(user?._id))
        .populate('blocedUsersId');
      if (!userMongoose) {
        return { message: 'No account' };
      }
      const geos = userMongoose.ips.map((obj) => ({
        session: {
          ...obj,
          geo: geoip.lookup(obj.ip),
        },
      }));
      return {
        sessions: geos,
      };
    }
  }
  async removeSession(user: IUser, ip: string, req) {
    if (!user) return;
    const userMongoose = await this.userModel.findById(
      new Types.ObjectId(user._id),
    );
    if (!userMongoose) return;
    const index = userMongoose.ips.find((obj) => obj.ip === ip);
    const updated = await this.userModel.updateOne(
      { _id: user._id },
      { $pull: { ips: { index } } },
    );

    // Если ничего не удалилось — значит такого IP и не было
    if (updated.modifiedCount === 0) {
      throw new BadRequestException('Такого IP нет в сессиях!');
    }

    return { message: 'Сессия успешно удалена.' };
  }
}
