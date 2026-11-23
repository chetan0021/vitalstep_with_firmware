// admin-dashboard-nextjs/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Polyfill global WebSocket for Node.js runtimes (e.g., Vercel Serverless Functions on Node 20)
// where @supabase/realtime-js throws "Node.js 20 detected without native WebSocket support"
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  ;(globalThis as any).WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oyqecdcpicvzwwvwaeka.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
  supabaseAnonKey

// Client-side Supabase instance singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Server-side Admin instance with full privileges (bypasses RLS safely in API routes)
// Guarded with typeof window === 'undefined' to eliminate "Multiple GoTrueClient instances detected" warning in browser console
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase
