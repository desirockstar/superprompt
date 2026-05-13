import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const { method, url, body } = request;
    const startTime = Date.now();

    if (process.env.NODE_ENV !== 'test') {
      this.logger.log({
        requestId,
        method,
        url,
        query: JSON.stringify(request.query),
        body: this.sanitizeBody(body),
      });
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log({
            requestId,
            method,
            url,
            status: response.statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            requestId,
            method,
            url,
            status: response.statusCode,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}