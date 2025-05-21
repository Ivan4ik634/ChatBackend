// src/socket-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: [
          'http://localhost:3000',
          'https://frontend-sand-eight-37.vercel.app',
        ], // Разрешить только фронтенду на этом порте
        methods: ['GET', 'POST'],
        credentials: true, // Если нужно передавать куки
      },
    });
    return server;
  }
}
