import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket.io.adapter';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // <-- обязательно
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  console.log(`Server running ${process.env.PORT || 4200}`);
  await app.listen(process.env.PORT || 4200);
}
bootstrap();
