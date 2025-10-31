/**
 * Tracing Middleware
 * 
 * Adds unique trace ID to each request for distributed tracing
 * 
 * Task 1.2: Express Tracing Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { generateTraceId } from '../services/logger.service';

/**
 * Augment Express Request type to include traceId
 */
declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

/**
 * Middleware to add trace ID to each request
 * 
 * Generates a unique trace ID using UUID v4 and attaches it to req.traceId
 * This allows tracking of requests across the application
 */
export function tracingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Generate and attach trace ID to request
  req.traceId = generateTraceId();
  
  // Continue to next middleware
  next();
}
