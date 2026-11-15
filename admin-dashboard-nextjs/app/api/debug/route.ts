import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Try querying all known table names to see which ones exist
  const tables = ['devices', 'device_inventory', 'profiles', 'measurements', 'research_patients']
  const results: Record<string, any> = {}

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(5)

    results[table] = {
      exists: !error,
      error: error?.message,
      count,
      sample: data?.slice(0, 2),
    }
  }

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    results,
  })
}
