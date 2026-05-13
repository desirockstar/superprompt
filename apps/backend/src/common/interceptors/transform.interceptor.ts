import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface ResponseWrapper<T> {
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseWrapper<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseWrapper<T>> {
    const requestId = (context.switchToHttp().getRequest().headers['x-request-id'] as string) || uuidv4();
    
    return next.handle().pipe(
      map((data) => {
        const isPaginated = data && 'total' in data && 'page' in data && 'limit' in data;
        
        return {
          data: data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            ...(isPaginated ? {
              pagination: {
                page: (data as any).page,
                limit: (data as any).limit,
                total: (data as any).total,
                totalPages: Math.ceil((data as any).total / (data as any).limit),
              },
            } : undefined),
          },
        };
      }),
    );
  }
}

@Injectable()
export class TransformPlainInterceptor<T> implements NestInterceptor<T, T> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle();
  }
}