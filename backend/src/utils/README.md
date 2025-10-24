# Utils

This folder contains utility functions and helper modules.

## Purpose:
- Reusable helper functions
- Configuration utilities
- Common operations
- Constants

## Naming Convention:
- Use camelCase for utility files
- Pure functions preferred

## Example:
```typescript
// logger.ts
export function logInfo(message: string): void {
  console.info(`[INFO] ${new Date().toISOString()} - ${message}`);
}

// validators.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```
