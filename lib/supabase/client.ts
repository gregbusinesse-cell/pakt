// lib/supabase/client.ts
// Client-side Supabase instance

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'

export const createClient = () => createClientComponentClient<Database>()
