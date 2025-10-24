# Services

This folder contains business logic and external integrations.

## Purpose:
- Services handle core business logic
- Database operations
- External API calls (Supabase, Gemini AI)
- Data processing

## Naming Convention:
- Use camelCase with 'Service' suffix (e.g., `aiService.ts`)
- Class-based or function-based services

## Example:
```typescript
import { supabase } from '../utils/database';

export class CasesService {
  static async getAll() {
    const { data, error } = await supabase
      .from('cases')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}
```
