import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Explicitly enable session persistence (default is true)
        autoRefreshToken: true, // Auto refresh the token before it expires
        detectSessionInUrl: true, // Detect OAuth session in URL
        storageKey: 'tpv-cowork-auth', // Custom storage key for this app
    },
})
