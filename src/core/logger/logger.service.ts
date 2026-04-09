import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly pino: PinoLogger) {}

  setContext(context: string) {
    this.pino.setContext(context);
  }

  info(message: string, meta?: Record<string, any>) {
    this.pino.info(meta ?? {}, message);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.pino.debug(meta ?? {}, message);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.pino.warn(meta ?? {}, message);
  }

  error(message: string, error?: unknown, meta?: Record<string, any>) {
    this.pino.error(
      {
        // 🔥 Always include error properly
        err:
          error instanceof Error
            ? {
                type: error.constructor.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        ...meta,
      },
      message,
    );
  }
}
