import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getLinkPreview } from 'link-preview-js';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { IUser } from 'src/common/dto/IUser';
import { Chat, ChatDocument } from 'src/schemas/chat.schema';
import { Message, MessageDocument } from 'src/schemas/message.schema';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private ChatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private MessageModel: Model<MessageDocument>,
  ) {}
  async findChats(user: IUser) {
    if (!user) return { message: 'user is not default' };

    const chats = await this.ChatModel.find({
      participantIds: { $in: [new Types.ObjectId(user._id)] },
    })
      .populate('participantIds')
      .populate('lastMessage');

    return chats;
  }
  async ChatPin(id: { id: string }, user: IUser) {
    if (user) {
      const userMongoose = await this.userModel.findById(user._id);
      const chatMongoose = await this.ChatModel.findById(
        //@ts-ignore
        new Types.ObjectId(id),
      );
      if (!chatMongoose) {
        return 'Такого чата немає!';
      }

      console.log(
        userMongoose?.pinnedChatId,
        id.id,
        userMongoose?.pinnedChatId.some((obj) => obj.id.toString() === id.id),
      );
      if (
        userMongoose?.pinnedChatId.some((obj) => obj.id.toString() === id.id)
      ) {
        return this.userModel.updateOne(
          { _id: user._id },
          { $pull: { pinnedChatId: id } },
        );
      }
      return this.userModel.updateOne(
        { _id: user._id },
        { $push: { pinnedChatId: id } },
      );
    }
  }
  async LinkPreview(body: { data: { url: string } }, user: IUser) {
    console.log(body);
    if (!user) return { message: 'No account' };
    return await getLinkPreview(body.data.url);
  }
  async ChatMessages(body: { data: { chatId: string } }, user: IUser) {
    if (!user) return { message: 'No account' };
    const messages = await this.MessageModel.find({
      chatId: new Types.ObjectId(body.data.chatId),
    })
      .populate('replyToMessage')
      .sort({ createdAt: -1 })
      .limit(10);
    return messages;
  }
}
