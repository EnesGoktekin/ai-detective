# Controllers

This folder contains route handler logic.

## Purpose:
- Controllers receive requests from routes
- Process request data
- Call services for business logic
- Return responses

## Naming Convention:
- Use camelCase with 'Controller' suffix (e.g., `chatController.ts`)
- One controller per domain

## Example:
```typescript
import { Request, Response } from 'express';
import { CasesService } from '../services/casesService';

export async function getCases(req: Request, res: Response): Promise<void> {
  try {
    const cases = await CasesService.getAll();
    res.status(200).json({ data: cases });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
}
```
