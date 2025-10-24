# Middleware

This folder contains Express middleware functions.

## Purpose:
- Request/response processing
- Authentication & authorization
- Validation
- Error handling
- Logging

## Naming Convention:
- Use camelCase for middleware files
- Descriptive names (e.g., `authMiddleware.ts`, `validateRequest.ts`)

## Example:
```typescript
import { Request, Response, NextFunction } from 'express';

export function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken) {
    res.status(401).json({ error: 'Session token required' });
    return;
  }
  
  next();
}
```
