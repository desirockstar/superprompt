import { Controller, Get } from '@nestjs/common';

@Controller('debug')
export class DebugController {
  @Get('env')
  getEnv() {
    const dbUrl = process.env.DATABASE_URL;
    return {
      dbUrl: dbUrl ? dbUrl.replace(/:(?:[^:@\n]+)@/, ':*****@') : 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      cwd: process.cwd(),
    };
  }
}