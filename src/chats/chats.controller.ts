import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from 'src/common/guards/CheckJWT.guard';
import { CurrentUser } from 'src/common/decorators/UserNew';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}
  @UseGuards(JwtAuthGuard)
  @Get('')
  async findChats(@CurrentUser() user) {
    return this.chatsService.findChats(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/pin/:id')
  async chatPin(@Param() id, @CurrentUser() user) {
    return this.chatsService.ChatPin(id, user);
  }
  @UseGuards(JwtAuthGuard)
  @Post('/LinkPreview')
  async LinkPreview(@Body() body, @CurrentUser() user) {
    return this.chatsService.LinkPreview(body, user);
  }
  @UseGuards(JwtAuthGuard)
  @Post('messages')
  async ChatMessages(@Body() body, @Query() query, @CurrentUser() user) {
    console.log(query);
    return this.chatsService.ChatMessages(body, user);
  }
}
