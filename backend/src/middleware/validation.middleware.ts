/**
 * Request Validation Middleware
 * 
 * Validates incoming requests for proper format and required fields
 * Phase 5, Step 5.6
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Middleware: Validate UUID parameter
 * Use for routes with :id, :case_id, :game_id, etc.
 */
export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      res.status(400).json({
        error: `Missing required parameter: ${paramName}`,
        param: paramName
      });
      return;
    }

    if (!isValidUUID(paramValue)) {
      res.status(400).json({
        error: `Invalid UUID format for parameter: ${paramName}`,
        param: paramName,
        value: paramValue
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Validate required body fields
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missingFields
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Validate message content
 * Used for chat endpoints
 */
export const validateMessageContent = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({
      error: 'Missing required field: message'
    });
    return;
  }

  if (typeof message !== 'string') {
    res.status(400).json({
      error: 'Message must be a string'
    });
    return;
  }

  const trimmedMessage = message.trim();

  // Check if message is empty
  if (trimmedMessage.length === 0) {
    res.status(400).json({
      error: 'Message cannot be empty'
    });
    return;
  }

  // Check if message is too short (single character)
  if (trimmedMessage.length === 1) {
    res.status(400).json({
      error: 'Message must be at least 2 characters long'
    });
    return;
  }

  // Check if message contains only valid characters (letters, spaces, punctuation)
  const validMessageRegex = /^[a-zA-Z\s.,!?'-]+$/;
  if (!validMessageRegex.test(trimmedMessage)) {
    res.status(400).json({
      error: 'Message can only contain letters, spaces, and basic punctuation'
    });
    return;
  }

  // Check message length (max 500 characters)
  if (trimmedMessage.length > 500) {
    res.status(400).json({
      error: 'Message is too long (max 500 characters)',
      max_length: 500,
      current_length: trimmedMessage.length
    });
    return;
  }

  // Replace message with trimmed version
  req.body.message = trimmedMessage;
  next();
};

/**
 * Middleware: Validate evidence_id in body
 */
export const validateEvidenceId = (req: Request, res: Response, next: NextFunction): void => {
  const { evidence_id } = req.body;

  if (!evidence_id) {
    res.status(400).json({
      error: 'Missing required field: evidence_id'
    });
    return;
  }

  if (!isValidUUID(evidence_id)) {
    res.status(400).json({
      error: 'Invalid UUID format for evidence_id',
      value: evidence_id
    });
    return;
  }

  next();
};

/**
 * Middleware: Validate suspect_id in body
 */
export const validateSuspectId = (req: Request, res: Response, next: NextFunction): void => {
  const { accused_suspect_id } = req.body;

  if (!accused_suspect_id) {
    res.status(400).json({
      error: 'Missing required field: accused_suspect_id'
    });
    return;
  }

  if (!isValidUUID(accused_suspect_id)) {
    res.status(400).json({
      error: 'Invalid UUID format for accused_suspect_id',
      value: accused_suspect_id
    });
    return;
  }

  next();
};

/**
 * Middleware: Validate case_id in body
 */
export const validateCaseIdBody = (req: Request, res: Response, next: NextFunction): void => {
  const { case_id } = req.body;

  if (!case_id) {
    res.status(400).json({
      error: 'Missing required field: case_id'
    });
    return;
  }

  if (!isValidUUID(case_id)) {
    res.status(400).json({
      error: 'Invalid UUID format for case_id',
      value: case_id
    });
    return;
  }

  next();
};

/**
 * Middleware: Sanitize request body (prevent XSS)
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      if (typeof value === 'string') {
        // Remove HTML tags and script tags
        req.body[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
    });
  }
  next();
};

/**
 * Middleware: Rate limiting per endpoint (basic implementation)
 * More sophisticated rate limiting should use redis or similar
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const basicRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use IP address as identifier (in production, use user ID or session)
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retry_after: Math.ceil((record.resetTime - now) / 1000) + ' seconds'
      });
      return;
    }

    record.count++;
    next();
  };
};

/**
 * Cleanup old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
