import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

// In-memory rate limiter (per edge function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // max requests per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true
  }
  return false
}

// Clean up old entries periodically
function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}

// Session expiration: 24 hours
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

// Validate session code format: exactly 4 uppercase alphanumeric chars (no ambiguous chars)
const SESSION_CODE_REGEX = /^[A-Z2-9]{4}$/

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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') ||
                     'unknown'

    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Periodic cleanup
    cleanupRateLimitMap()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const method = req.method

    // CREATE session - POST /session
    if (method === 'POST') {
      let body: Record<string, unknown>
      try {
        body = await req.json()
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const totalDurationRaw = body.total_duration
      const total_duration = typeof totalDurationRaw === 'number' && 
                             Number.isInteger(totalDurationRaw) && 
                             totalDurationRaw > 0 && 
                             totalDurationRaw <= 3600
        ? totalDurationRaw
        : 600

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

      if (attempts >= 5) {
        console.error('Failed to generate unique session code after 5 attempts')
        return new Response(
          JSON.stringify({ error: 'Failed to create session. Please try again.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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

      console.log(`Session created: ${code} from IP: ${clientIp}`)
      return new Response(
        JSON.stringify({ session: data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET session by code - GET /session?code=XXXX
    if (method === 'GET') {
      const code = url.searchParams.get('code')?.trim().toUpperCase()
      
      if (!code || !SESSION_CODE_REGEX.test(code)) {
        return new Response(
          JSON.stringify({ error: 'Invalid session code format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('shower_sessions')
        .select('*')
        .eq('session_code', code)
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

      // Check session expiration
      const sessionAge = Date.now() - new Date(data.created_at).getTime()
      if (sessionAge > SESSION_MAX_AGE_MS) {
        console.log(`Expired session accessed: ${code}`)
        return new Response(
          JSON.stringify({ error: 'Session has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ session: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE session - PATCH /session?id=XXX or /session?code=XXX
    if (method === 'PATCH') {
      const id = url.searchParams.get('id')?.trim()
      const code = url.searchParams.get('code')?.trim().toUpperCase()

      // Validate identifiers
      if (code && !SESSION_CODE_REGEX.test(code)) {
        return new Response(
          JSON.stringify({ error: 'Invalid session code format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate UUID format for id
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (id && !UUID_REGEX.test(id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid session ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!id && !code) {
        return new Response(
          JSON.stringify({ error: 'Missing id or code parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let body: Record<string, unknown>
      try {
        body = await req.json()
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Only allow updating specific fields with validation
      const allowedFields = ['state', 'current_step_index', 'time_remaining', 'total_duration']
      const validStates = ['idle', 'setup', 'waiting', 'ready', 'running', 'paused', 'finished']
      const updates: Record<string, unknown> = { last_update: new Date().toISOString() }
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          // Validate each field
          if (field === 'state') {
            if (typeof body[field] !== 'string' || !validStates.includes(body[field] as string)) {
              return new Response(
                JSON.stringify({ error: `Invalid state value` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else if (field === 'current_step_index') {
            if (typeof body[field] !== 'number' || !Number.isInteger(body[field] as number) || (body[field] as number) < 0 || (body[field] as number) > 20) {
              return new Response(
                JSON.stringify({ error: `Invalid step index` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else if (field === 'time_remaining' || field === 'total_duration') {
            if (typeof body[field] !== 'number' || !Number.isInteger(body[field] as number) || (body[field] as number) < 0 || (body[field] as number) > 7200) {
              return new Response(
                JSON.stringify({ error: `Invalid ${field} value` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
          updates[field] = body[field]
        }
      }

      let query = supabase.from('shower_sessions').update(updates)
      
      if (id) {
        query = query.eq('id', id)
      } else if (code) {
        query = query.eq('session_code', code)
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
