import { createClient } from '@supabase/supabase-js'

// This client is for server-side use only, with the service role key.
// It bypasses RLS and should be used with caution.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
