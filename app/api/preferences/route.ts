// app/api/preferences/route.ts
// Save user preferences (distance, age range, skill filters)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { preferences } = body

    console.log('[PREFERENCES] Received request body:', { body, preferences })

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences object' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Validate preferences structure
    const { distance_km, age_min, age_max, skill_filters } = preferences
    console.log('[PREFERENCES] Extracted values:', { distance_km, age_min, age_max, skill_filters, types: { distance_km: typeof distance_km, age_min: typeof age_min, age_max: typeof age_max } })

    if (typeof distance_km !== 'number' || distance_km < 0 || distance_km > 1000) {
      return NextResponse.json({ error: 'Invalid distance_km' }, { status: 400 })
    }

    if (typeof age_min !== 'number' || age_min < 18 || age_min > 99) {
      return NextResponse.json({ error: 'Invalid age_min' }, { status: 400 })
    }

    if (typeof age_max !== 'number' || age_max < 18 || age_max > 99) {
      return NextResponse.json({ error: 'Invalid age_max' }, { status: 400 })
    }

    if (age_min > age_max) {
      return NextResponse.json({ error: 'age_min must be <= age_max' }, { status: 400 })
    }

    // Validate skill filters if present
    if (skill_filters && !Array.isArray(skill_filters)) {
      return NextResponse.json({ error: 'skill_filters must be an array' }, { status: 400 })
    }

    // Update preferences
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: {
          distance_km,
          age_min,
          age_max,
          skill_filters: skill_filters || [],
        },
      })
      .eq('id', user.id)

    if (error) {
      console.error('[PREFERENCES] update error', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    console.log(`[PREFERENCES] user ${user.id} updated preferences`, preferences)
    return NextResponse.json({
      saved: true,
      preferences: {
        distance_km,
        age_min,
        age_max,
        skill_filters: skill_filters || [],
      }
    })
  } catch (err) {
    console.error('[PREFERENCES] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
