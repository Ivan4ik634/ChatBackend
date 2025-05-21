import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateDto, EditDto, LoginDto } from 'src/common/dto/createUserDTO';
import { CurrentUser } from 'src/common/decorators/UserNew';
import { JwtAuthGuard } from 'src/common/guards/CheckJWT.guard';
import { CurrentIp } from 'src/common/decorators/CurrectIp';
import { IUser } from 'src/common/dto/IUser';
import {
  BodyEmailRefresh,
  BodyEmailVerifyToken,
} from 'src/common/dto/body.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UsePipes(new ValidationPipe())
  @Post('/register')
  async register(
    @Res() res,
    @Req() req,
    @Body() dto: CreateDto,
    @CurrentIp() ip: string,
  ): Promise<{ token: string }> {
    return this.userService.register(dto, ip, res, req);
  }
  @UsePipes(new ValidationPipe())
  @Post('/login')
  async login(
    @Res() res,
    @Req() req,

    @Body() dto: LoginDto,
    @CurrentIp() ip: string,
  ) {
    return this.userService.login(dto, ip, res, req);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async ViewMeProfile(
    @CurrentUser() user,
    @Request() req,
    @CurrentIp() ip: string,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    return this.userService.profileInfo(user, userAgent, ip);
  }
  @UseGuards(JwtAuthGuard)
  @Post('/profile')
  async EditProfile(@Body() dto: EditDto, @CurrentUser() user) {
    return this.userService.EditProfile(dto, user);
  }
  @Post('/verify')
  async EmailVerify(@Body() body: BodyEmailVerifyToken) {
    return this.userService.EmailVerify(body);
  }
  @Post('/refresh-send-email')
  async RefreshSendEmail(@Body() body: BodyEmailRefresh) {
    return this.userService.RefreshSendEmail(body);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/sessions')
  async GetSession(@CurrentUser() user: IUser, @Req() req) {
    return this.userService.GetSessions(user);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('/session')
  async RemoveSession(
    @CurrentUser() user: IUser,
    @Body() body: { ip: string },
    @Req() req,
  ) {
    return this.userService.removeSession(user, body.ip, req);
  }
  @Get('/all')
  async FullUsers(@Query() query) {
    return this.userService.FullUsers(query);
  }
  @Get('/profile/:id')
  async ViewUserProfile(@Param() id: string) {
    return this.userService.profileUser(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async BlockUser(@Param('id') id: string, @CurrentUser() user) {
    return this.userService.blockUser(id, user);
  }
}
