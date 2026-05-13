import 'reflect-metadata';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const possiblePaths = [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
];

let loaded = false;
for (const p of possiblePaths) {
  if (existsSync(p)) {
    console.log('[DOTENV] Found at:', p);
    config({ path: p });
    loaded = true;
    break;
  }
}
if (!loaded) {
  console.log('[DOTENV] Not found in any of:', possiblePaths);
}
console.log('[DOTENV] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const API_VERSION = process.env.API_VERSION || 'v1';

async function bootstrap() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter);

  app.setGlobalPrefix(`api/${API_VERSION}`);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SuperPrompt API')
      .setVersion(API_VERSION)
      .setDescription(`
## SuperPrompt - AI Prompt Marketplace API

### Authentication
Most endpoints require authentication. Use the login/register endpoints to get a session cookie.

### Rate Limits
- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute

### Error Responses
All errors follow a standard format:
\`\`\`json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint",
  "requestId": "uuid"
}
\`\`\`
      `)
      .addServer(`http://localhost:4000`, 'Development')
      .addServer('https://api.superprompt.ai', 'Production')
      .addCookieAuth('better-auth.session_token', { 
        description: 'Session cookie from login/register',
        type: 'http'
      })
      .build();
    
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    console.log('Swagger UI available at: /api/docs');
  }

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Backend running on port ${port} (API: /api/${API_VERSION})`);
}
bootstrap();