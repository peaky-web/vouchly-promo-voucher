import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()

const key = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL is missing. Check your .env file.'
  )
}

if (!key) {
  throw new Error(
    'Supabase API key is missing. Check your .env file.'
  )
}

export const supabase = createClient(url, key)