import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { getLinkPreview } from 'link-preview-js';
import mongoose, { Model, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import {
  DeleteChat,
  DeleteMessage,
  EditMessage,
  EmojiSend,
  IparticipantIds,
  LoadMessages,
  MessagePayload,
} from 'src/@types/ChatSocket';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { Chat, ChatDocument } from 'src/schemas/chat.schema';
import { Message, MessageDocument } from 'src/schemas/message.schema';
import { User, UserDocument } from 'src/schemas/user.schema';

@WebSocketGateway()
export class ChatSocket
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private ChatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private MessageModel: Model<MessageDocument>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @WebSocketServer() server: Server;
  afterInit(server: any) {
    console.log(`Nest LOG: Init socket.io Gateway `);
  }
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomId: string) {
    console.log('Joing room', roomId);
    await client.join(roomId);
  }
  /**
   * Handle a client connection from the server.
   *
   * @param client - The client that disconnected.
   */
  async handleConnection(client: Socket) {
    const { userId } = client.handshake.auth;
    console.log('Updating user to online', userId);

    if (!userId) {
      console.warn('User connected without userId');
      return;
    }

    client.data = {}; // обязательно инициализируй
    client.data.userId = userId;
    console.log('Updating user to online data.userId', client.data.userId);

    await client.join('global-room');
    await this.userModel.findByIdAndUpdate(userId, { online: true });

    const chats = await this.ChatModel.find({
      participantIds: { $in: new Types.ObjectId(userId) },
    }).populate('participantIds');

    // this.server.to('global-room').emit('users:online', { chats });
  }

  /**
   * Handle a client disconnecting from the server.
   * @param client - The client that disconnected.
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId || client.handshake.auth.userId;

    console.log('Updating user to offline', userId);
    await this.userModel.findByIdAndUpdate(userId, { online: false });

    console.log('User updated to offline', userId);
    const chats = await this.ChatModel.find({
      participantIds: { $in: new Types.ObjectId(userId) },
    }).populate('participantIds');

    // this.server.to('global-room').emit('users:online', { chats });
  }
  @SubscribeMessage('load-messages')
  async handleLoadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: LoadMessages,
  ) {
    const messages = await this.MessageModel.find({
      chatId: new Types.ObjectId(messagePayload.chatId),
    })
      .populate('replyToMessage')
      .sort({ createdAt: -1 })
      .limit(10)
      .skip(messagePayload.skip);
    this.server.emit('loaded-messages', {
      chatId: messagePayload.chatId,
      messages,
    });
  }

  @SubscribeMessage('message-reads')
  async handleReadMessage(client: Socket, messagePayload: DeleteChat) {
    const chat = await this.ChatModel.findOne({
      _id: new Types.ObjectId(messagePayload.chatId),
    }).populate('participantIds');

    if (!chat) {
      throw new Error('Chat not found');
    }
    console.log(chat);
    // Обновление всех сообщений с isRead: false на isRead: true в MessageModel
    await this.MessageModel.updateMany(
      {
        chatId: new Types.ObjectId(messagePayload.chatId),
        receiverId: messagePayload.receiverId,
        isRead: false,
      },
      { isRead: true },
    );
    const messages = await this.MessageModel.find({
      chatId: new Types.ObjectId(messagePayload.chatId),
    })
      .populate('replyToMessage')
      .sort({ createdAt: -1 });

    await this.ChatModel.updateOne(
      { _id: chat._id },
      { lastMessage: messages[0]._id ? messages[0]._id : null },
    );
    await chat.save();

    // Отправляем обновления через сокеты
    this.server.to(messagePayload.chatId).emit('reads-messages', { messages });
    this.server
      .to(messagePayload.receiverId)
      .emit('reads-messages', { messages });
    this.server
      .to(messagePayload.senderId)
      .emit('reads-messages', { messages });
  }

  @SubscribeMessage('DeleteChat')
  async handleDeleteChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: DeleteChat,
  ) {
    await this.MessageModel.deleteMany({
      chatId: new Types.ObjectId(messagePayload.chatId),
    });
    await this.ChatModel.deleteOne({ _id: messagePayload.chatId });
    this.server
      .to(messagePayload.receiverId)
      .emit('ChatDelete', { chatId: messagePayload.chatId });
    this.server
      .to(messagePayload.senderId)
      .emit('ChatDelete', { chatId: messagePayload.chatId });
  }
  @SubscribeMessage('HistoryClear')
  async handleHistoryClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: DeleteChat,
  ) {
    // Check if the message payload is valid
    if (!messagePayload || !messagePayload.chatId) {
      // Throw an error if the payload is invalid
      throw new Error('Invalid message payload');
    }
    const chat = await this.ChatModel.findOne({
      _id: new Types.ObjectId(messagePayload.chatId),
    }).populate('participantIds');

    if (!chat) {
      throw new Error('Chat not found');
    }
    try {
      // Delete all messages associated with the given chatId
      await this.MessageModel.deleteMany({
        chatId: new Types.ObjectId(messagePayload.chatId),
      });
      await this.ChatModel.updateOne({ _id: chat._id }, { lastMessage: null });
      await chat.save();
      // Emit a 'HistoryClear' event to all clients in the room with the given chatId
      this.server.to(messagePayload.chatId).emit('ClearChat', { chat });
      this.server.to(messagePayload.receiverId).emit('ClearChat', { chat });
      this.server.to(messagePayload.senderId).emit('ClearChat', { chat });
    } catch (error) {
      // Log any errors that occur during the process
      console.error('Error handling message:', error);
    }
  }
  @SubscribeMessage('typingUser')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: DeleteChat,
  ) {
    this.server.to(messagePayload.chatId).emit('userTyping', {
      chatId: messagePayload.chatId,
      userId: messagePayload.senderId,
    });
    this.server.to(messagePayload.receiverId).emit('userTyping', {
      chatId: messagePayload.chatId,
      userId: messagePayload.senderId,
    });
  }
  @SubscribeMessage('stopTyping')
  // Пользователь остановился
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: DeleteChat,
  ) {
    this.server.to(messagePayload.chatId).emit('userStoppedTyping', {
      chatId: messagePayload.chatId,
      userId: messagePayload.senderId,
    });
    this.server.to(messagePayload.receiverId).emit('userStoppedTyping', {
      chatId: messagePayload.chatId,
      userId: messagePayload.senderId,
    });
  }

  @SubscribeMessage('DeleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: DeleteMessage,
  ) {
    const chat = await this.ChatModel.findOne({
      _id: new Types.ObjectId(messagePayload.chatId),
    }).populate('participantIds');

    if (!chat) return { message: 'Немає чату' };

    await this.MessageModel.deleteOne({
      _id: new Types.ObjectId(messagePayload.MessageId),
    });
    const messages = await this.MessageModel.find({
      chatId: chat._id,
    })
      .populate('replyToMessage')
      .sort({ createdAt: -1 })
      .limit(2);
    await this.ChatModel.updateOne(
      { _id: chat._id },
      { lastMessage: messages[0]._id },
    );
    await chat.save();
    this.server.to(messagePayload.chatId).emit('MessageDelete', {
      chatId: messagePayload.chatId,
      messageId: messagePayload.MessageId,
      prevMessage: messages[0],
    });
    this.server.to(messagePayload.senderId).emit('MessageDelete', {
      chatId: messagePayload.chatId,
      messageId: messagePayload.MessageId,
      prevMessage: messages[0],
    });
    this.server.to(messagePayload.receiverId).emit('MessageDelete', {
      chatId: messagePayload.chatId,
      messageId: messagePayload.MessageId,
      prevMessage: messages[0],
    });
  }
  @SubscribeMessage('EditMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: EditMessage,
  ) {
    const chat = await this.ChatModel.findOne({
      _id: new Types.ObjectId(messagePayload.chatId),
    })

      .populate('participantIds');
    console.log(messagePayload);
    if (!chat) return { message: 'Немає чату' };

    const messages = await this.MessageModel.find({
      chatId: chat._id,
    })
      .populate('replyToMessage')
      .limit(5);
    const message = messages.find(
      (obj) => String(obj._id) === messagePayload.MessageId,
    );
    if (!messages) return { message: 'Немає повідомлення' };
    if (!message) return { message: 'Немає повідомлення' };

    message.text = messagePayload.text;
    message.isEdit = true;
    console.log('message до', message);
    await message.save();
    console.log('message после', message);
    await this.ChatModel.updateOne(
      { _id: chat._id },
      { lastMessage: messages[0]._id ? messages[0]?._id : null },
    );
    await chat.save();
    console.log();

    this.server.to(messagePayload.chatId).emit('MessageEdit', {
      chatId: messagePayload.chatId,
      message,
      prevMessage: messages[0],
    });
    this.server.to(messagePayload.senderId).emit('MessageEdit', {
      chatId: messagePayload.chatId,
      message,
      prevMessage: messages[0],
    });
    this.server.to(messagePayload.receiverId).emit('MessageEdit', {
      chatId: messagePayload.chatId,
      message,
      prevMessage: messages[0],
    });
  }
  @SubscribeMessage('ReactionSend')
  async handleEmojiMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: EmojiSend,
  ) {
    const chat = await this.ChatModel.findOne({
      _id: new Types.ObjectId(messagePayload.chatId),
    }).populate('participantIds');

    if (!chat) return { message: 'Немає чату' };
    const message = await this.MessageModel.findOne({
      _id: new Types.ObjectId(messagePayload.messageId),
    }).populate('replyToMessage');

    if (!message) return { message: 'Такого повідомлення немає!' };
    if (
      message.reactions.some(
        (obj) =>
          String(obj.user) === messagePayload.senderId &&
          obj.reaction === messagePayload.emoji,
      )
    ) {
      await this.MessageModel.updateOne(
        {
          _id: new Types.ObjectId(messagePayload.messageId),
        },
        {
          $pull: {
            reactions: {
              user: messagePayload.senderId,
            },
          },
        },
      );
    } else {
      if (
        message.reactions.some(
          (obj) => String(obj.user) === messagePayload.senderId,
        )
      ) {
        await this.MessageModel.updateOne(
          {
            _id: new Types.ObjectId(messagePayload.messageId),
          },
          {
            $pull: {
              reactions: {
                user: messagePayload.senderId,
              },
            },
          },
        );
      }
      await this.MessageModel.updateOne(
        {
          _id: new Types.ObjectId(messagePayload.messageId),
        },
        {
          $push: {
            reactions: {
              user: messagePayload.senderId,
              reaction: messagePayload.emoji,
            },
          },
        },
      );
    }

    await chat.save();
    const updateMessage = await this.MessageModel.findOne({
      _id: new Types.ObjectId(messagePayload.messageId),
    }).populate('replyToMessage');
    this.server.to(messagePayload.chatId).emit('SendReaction', {
      chatId: messagePayload.chatId,
      message: updateMessage,
    });
    this.server.to(messagePayload.senderId).emit('SendReaction', {
      chatId: messagePayload.chatId,
      message: updateMessage,
    });
    this.server.to(messagePayload.receiverId).emit('SendReaction', {
      chatId: messagePayload.chatId,
      message: updateMessage,
    });
  }
  @SubscribeMessage('SendMessage')

  /**
   * Handle a message from the client.
   * @param messagePayload - The data containing senderId, receiverId, and message text.
   * @throws Error - If the chat is not found.
   */
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: MessagePayload,
  ) {
    try {
      const userId = client?.data?.userId || client?.handshake?.auth?.userId;

      if (!userId) {
        console.error('Missing userId in client');
        return;
      }
      console.log('handleMessage:', messagePayload);

      const chat = await this.ChatModel.findOne({
        _id: new Types.ObjectId(messagePayload.chatId),
      })

        .populate('participantIds');
      if (!chat) {
        throw new Error('Chat not found');
      }

      const newMessage = new this.MessageModel({
        chatId: chat._id,
        senderId: messagePayload.senderId,
        receiverId: messagePayload.receiverId,
        text: messagePayload.text,
        photos: messagePayload.file,
        replyToMessage: messagePayload.replyToMessage,
        voise: messagePayload.voise,
        _id: new Types.ObjectId(),
      });
      await newMessage.save();
      await this.ChatModel.updateOne(
        { _id: chat._id },
        { lastMessage: newMessage._id },
      );
      await chat.save();

      this.server
        .to(chat._id.toString())
        .emit('message', { message: newMessage });
      this.server.to('global-room').emit('message-global', {
        chatId: chat._id.toString(),
        message: newMessage,
      });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  @SubscribeMessage('CreateChat')
  async handleCreateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() messagePayload: IparticipantIds,
  ) {
    try {
      const userId = client?.data?.userId || client?.handshake?.auth?.userId;
      console.log('SenderId:', messagePayload.senderId);
      console.log('ReceiverId:', messagePayload.receiverId);

      // Проверка на валидность ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(messagePayload.senderId) ||
        !mongoose.Types.ObjectId.isValid(messagePayload.receiverId)
      ) {
        throw new Error('Invalid ObjectId');
      }
      // Создание нового чата
      const NewChat = new this.ChatModel({
        participantIds: [
          new Types.ObjectId(messagePayload.senderId),
          new Types.ObjectId(messagePayload.receiverId),
        ],
        _id: new Types.ObjectId(),
      });

      console.log('Chat object:', NewChat);

      // Сохранение чата
      await NewChat.save();
      const chat = await this.ChatModel.findOne({ _id: NewChat._id }).populate(
        'participantIds',
      );
      // Отправка через сокет

      this.server
        .to(messagePayload.receiverId)
        .emit('Chat-Create', { chat: chat });
      this.server
        .to(messagePayload.senderId)
        .emit('Chat-Create', { chat: chat });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
}
