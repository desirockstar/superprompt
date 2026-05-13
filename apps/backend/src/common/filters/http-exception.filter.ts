import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, status, requestId);

    this.logError(exception, status, request, requestId);

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    status: number,
    requestId: string,
  ): ErrorResponse {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;

      return {
        code: this.getErrorCode(status),
        message: Array.isArray(message) ? message.join(', ') : message,
        details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
        timestamp: new Date().toISOString(),
        path: '',
        requestId,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : (exception as Error).message || 'Unknown error',
      timestamp: new Date().toISOString(),
      path: '',
      requestId,
    };
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private logError(
    exception: unknown,
    status: number,
    request: Request,
    requestId: string,
  ) {
    const logLevel = status >= 500 ? 'error' : 'warn';

    this.logger[logLevel]({
      requestId,
      method: request.method,
      url: request.url,
      status,
      exception:
        process.env.NODE_ENV !== 'production'
          ? exception instanceof Error
            ? { name: exception.name, message: exception.message, stack: exception.stack }
            : exception
          : undefined,
    });
  }
}