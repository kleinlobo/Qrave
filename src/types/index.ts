// TypeScript types derived from the Supabase database schema.
// The Database type is generated in Phase 3 via: npx supabase gen types typescript
// Until then this file is a placeholder — import directly from ./database once generated.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
