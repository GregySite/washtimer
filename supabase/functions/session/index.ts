import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

// Generate a simple 4-char session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const method = req.method

    // CREATE session - POST /session
    if (method === 'POST') {
      const body = await req.json()
      const { total_duration = 600 } = body

      // Generate unique code (retry if collision)
      let code = generateSessionCode()
      let attempts = 0
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from('shower_sessions')
          .select('id')
          .eq('session_code', code)
          .maybeSingle()
        
        if (!existing) break
        code = generateSessionCode()
        attempts++
      }

      const { data, error } = await supabase
        .from('shower_sessions')
        .insert({
          session_code: code,
          state: 'idle',
          current_step_index: 0,
          time_remaining: total_duration,
          total_duration,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ session: data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET session by code - GET /session?code=XXXX
    if (method === 'GET') {
      const code = url.searchParams.get('code')
      
      if (!code || code.length !== 4) {
        return new Response(
          JSON.stringify({ error: 'Invalid session code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('shower_sessions')
        .select('*')
        .eq('session_code', code.toUpperCase())
        .maybeSingle()

      if (error) {
        console.error('Error fetching session:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ session: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE session - PATCH /session?id=XXX or /session?code=XXX
    if (method === 'PATCH') {
      const id = url.searchParams.get('id')
      const code = url.searchParams.get('code')
      const body = await req.json()

      // Only allow updating specific fields
      const allowedFields = ['state', 'current_step_index', 'time_remaining', 'total_duration']
      const updates: Record<string, unknown> = { last_update: new Date().toISOString() }
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      }

      let query = supabase.from('shower_sessions').update(updates)
      
      if (id) {
        query = query.eq('id', id)
      } else if (code) {
        query = query.eq('session_code', code.toUpperCase())
      } else {
        return new Response(
          JSON.stringify({ error: 'Missing id or code parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await query.select().single()

      if (error) {
        console.error('Error updating session:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ session: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
