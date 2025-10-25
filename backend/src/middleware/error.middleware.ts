/**
 * Error Handling Middleware
 * 
 * Centralized error handling for all routes
 * Phase 5, Step 5.7
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error Handler
 * Catches all undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    message: `Cannot ${req.method} ${req.path}`
  });
};

/**
 * Global Error Handler
 * Catches all errors thrown in the application
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
    return;
  }

  // Handle Supabase errors
  if (err.message && err.message.includes('PGRST')) {
    res.status(500).json({
      error: 'Database error',
      message: 'An error occurred while accessing the database',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON'
    });
    return;
  }

  // Default: Internal Server Error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database error handler
 * Specific handler for database-related errors
 */
export const handleDatabaseError = (error: any, res: Response): void => {
  console.error('Database error:', error);

  // PostgreSQL error codes
  const pgErrorCodes: { [key: string]: { status: number; message: string } } = {
    '23505': { status: 409, message: 'Duplicate entry - this record already exists' },
    '23503': { status: 400, message: 'Foreign key constraint violation' },
    '23502': { status: 400, message: 'Required field is missing' },
    '42703': { status: 500, message: 'Database schema error - invalid column' },
    '42P01': { status: 500, message: 'Database schema error - table does not exist' },
    'PGRST204': { status: 404, message: 'Resource not found' },
    'PGRST205': { status: 500, message: 'Database table not found in schema cache' },
  };

  const errorCode = error.code;
  const knownError = pgErrorCodes[errorCode];

  if (knownError) {
    res.status(knownError.status).json({
      error: knownError.message,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }

  // Unknown database error
  res.status(500).json({
    error: 'Database operation failed',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred while processing your request',
    code: errorCode
  });
};

/**
 * AI service error handler
 * Specific handler for AI/Gemini service errors
 */
export const handleAIError = (error: any, res: Response): void => {
  console.error('AI service error:', error);

  // Check for rate limiting
  if (error.message && error.message.includes('quota')) {
    res.status(429).json({
      error: 'AI service quota exceeded',
      message: 'The AI service is temporarily unavailable. Please try again later.'
    });
    return;
  }

  // Check for API key issues
  if (error.message && error.message.includes('API key')) {
    res.status(500).json({
      error: 'AI service configuration error',
      message: 'The AI service is not properly configured'
    });
    return;
  }

  // Check for content policy violations
  if (error.message && error.message.includes('content policy')) {
    res.status(400).json({
      error: 'Content policy violation',
      message: 'Your message violates content policies. Please rephrase.'
    });
    return;
  }

  // Generic AI error
  res.status(500).json({
    error: 'AI service error',
    message: 'Failed to generate AI response. Please try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
