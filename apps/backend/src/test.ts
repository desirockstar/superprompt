import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';

@Controller('test')
class TestController {
  @Get()
  getTest() {
    return { message: 'test works' };
  }
}

@Module({ controllers: [TestController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4000);
  console.log('Running on 4000');
}
bootstrap();