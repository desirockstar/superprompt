import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'ok' | 'error';
    cache: 'ok' | 'error';
  };
}

@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  @Get('health')
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: 'ok',
        cache: 'ok',
      },
    };
  }

  @Get('health/ready')
  ready(): { ready: boolean; message: string } {
    return { ready: true, message: 'Service is ready' };
  }

  @Get('health/live')
  live(): { alive: boolean } {
    return { alive: true };
  }
}