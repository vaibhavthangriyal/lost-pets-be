import { Injectable } from '@nestjs/common';

export type LogContext = {
  contextId: string;
  requestId: string;
};

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

@Injectable()
export class LoggingService {
  info(message: string, context: LogContext, metadata: Record<string, unknown> = {}) {
    this.write('INFO', message, context, metadata);
  }

  warn(message: string, context: LogContext, metadata: Record<string, unknown> = {}) {
    this.write('WARN', message, context, metadata);
  }

  error(message: string, context: LogContext, error?: unknown, metadata: Record<string, unknown> = {}) {
    const errorDetails = error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
      : error === undefined ? {} : { errorMessage: String(error) };
    this.write('ERROR', message, context, { ...metadata, ...errorDetails });
  }

  private write(level: LogLevel, message: string, context: LogContext, metadata: Record<string, unknown>) {
    const entry = { timestamp: new Date().toISOString(), level, message, contextId: context.contextId, requestId: context.requestId, ...metadata };
    const output = JSON.stringify(entry);
    if (level === 'ERROR') console.error(output);
    else if (level === 'WARN') console.warn(output);
    else console.log(output);
  }
}
