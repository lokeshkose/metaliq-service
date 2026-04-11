import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Request, Response } from 'express';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';

// @Injectable()
// export class ResponseInterceptor<T>
//   implements NestInterceptor<T, ApiResponse<T>>
// {
//   intercept(
//     context: ExecutionContext,
//     next: CallHandler<T>,
//   ): Observable<ApiResponse<T>> {
//     const httpCtx = context.switchToHttp();
//     const request = httpCtx.getRequest<Request>();
//     const response = httpCtx.getResponse<Response>();

//     const startTime = process.hrtime.bigint();

//     const requestId =
//       (request.headers['x-request-id'] as string) ??
//       uuid();

//     (request as any).requestId = requestId;

//     return next.handle().pipe(
//       map((result: any) => {
//         /**
//          * 1️⃣ Avoid double wrapping
//          */
//         if (result?.success === true && result?.requestId) {
//           return result;
//         }

//         /**
//          * 2️⃣ Skip streams / buffers
//          */
//         if (
//           result instanceof Buffer ||
//           typeof result?.pipe === 'function'
//         ) {
//           return result;
//         }

//         const durationMs =
//           Number(process.hrtime.bigint() - startTime) /
//           1_000_000;

//         /**
//          * 3️⃣ Extract message + data
//          * Supports:
//          * return { message, data }
//          * return data
//          */
//         const message =
//           result?.message ??
//           response.statusMessage ??
//           'Request successful';

//         const data =
//           result?.data !== undefined ? result.data : result;
//         const meta = result.meta;

//         return {
//           success: true,
//           statusCode: response.statusCode,
//           message,
//           requestId,
//           timestamp: new Date().toISOString(),
//           path: request.originalUrl,
//           method: request.method,
//           durationMs: Math.round(durationMs),
//           data,
//           meta
//         };
//       }),
//     );
//   }
// }

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const startTime = process.hrtime.bigint();

    const requestId = (request.headers['x-request-id'] as string) ?? uuid();

    (request as any).requestId = requestId;

    /**
     * ✅ 0️⃣ BYPASS INTERCEPTOR IF RESPONSE IS MANUALLY HANDLED
     * (i.e. using @Res() for file streaming)
     */
    if (context.switchToHttp().getResponse().headersSent) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result: any) => {
        /**
         * ✅ 1️⃣ HARD EXIT FOR FILE / STREAM / DOWNLOAD
         */
        if (
          response.headersSent ||
          response.writableEnded ||
          response.getHeader('Content-Type')?.toString().includes('application/vnd') || // excel
          response.getHeader('Content-Type')?.toString().includes('application/pdf') || // pdf
          result instanceof Buffer ||
          result instanceof Uint8Array ||
          typeof result?.pipe === 'function'
        ) {
          return result;
        }

        /**
         * ✅ 2️⃣ Avoid double wrapping
         */
        if (result?.success === true && result?.requestId) {
          return result;
        }

        const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;

        const message = result?.message ?? response.statusMessage ?? 'Request successful';

        const data = result?.data !== undefined ? result.data : result;

        const meta = result?.meta;

        return {
          success: true,
          statusCode: response.statusCode,
          message,
          requestId,
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
          method: request.method,
          durationMs: Math.round(durationMs),
          data,
          meta,
        };
      }),
    );
  }
}
