import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();