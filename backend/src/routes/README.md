# Routes

This folder contains API route definitions.

## Structure:
- Each route file handles a specific domain (e.g., `casesRoutes.ts`, `chatRoutes.ts`)
- Routes define endpoints and connect them to controllers
- Use Express Router for modular routing

## Naming Convention:
- Use camelCase with 'Routes' suffix (e.g., `sessionRoutes.ts`)
- Group related endpoints in same file

## Example:
```typescript
import { Router } from 'express';
import { getCases, getCaseById } from '../controllers/casesController';

const router = Router();

router.get('/', getCases);
router.get('/:id', getCaseById);

export default router;
```
