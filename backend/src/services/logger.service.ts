/**
 * Logger Service
 * 
 * Centralized logging service with trace ID support
 * for distributed tracing and debugging
 * 
 * Task 1.1: Traceable Logging
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique trace ID for request tracking
 */
export function generateTraceId(): string {
  return uuidv4();
}

/**
 * Log levels
 */
type LogLevel = 'info' | 'debug' | 'error';

/**
 * Base log structure
 */
interface BaseLog {
  traceId?: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

/**
 * Error log structure
 */
interface ErrorLog extends BaseLog {
  level: 'error';
  errorName: string;
  errorMessage: string;
  stack?: string;
}

/**
 * Logger object with structured JSON logging
 */
export const logger = {
  /**
   * Log informational messages
   */
  info(message: string, traceId?: string): void {
    const log: BaseLog = {
      traceId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
    };
    console.log(JSON.stringify(log));
  },

  /**
   * Log debug messages
   */
  debug(message: string, traceId?: string): void {
    const log: BaseLog = {
      traceId,
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
    };
    console.log(JSON.stringify(log));
  },

  /**
   * Log error messages with error details
   */
  error(message: string, error: Error, traceId?: string): void {
    const log: ErrorLog = {
      traceId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    };
    console.error(JSON.stringify(log));
  },
};
