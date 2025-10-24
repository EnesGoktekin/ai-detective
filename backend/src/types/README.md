# Types

This folder contains TypeScript type definitions and interfaces.

## Purpose:
- Define data structures
- Type safety across the application
- API request/response types
- Database model types

## Naming Convention:
- Use `.types.ts` suffix for type-only files
- Use PascalCase for types and interfaces

## Example:
```typescript
export interface Case {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}
```
