-- Lock down shower sessions (no public access)
DROP POLICY IF EXISTS "Anyone can delete shower sessions" ON public.shower_sessions;
DROP POLICY IF EXISTS "Anyone can insert shower sessions" ON public.shower_sessions;
DROP POLICY IF EXISTS "Anyone can read shower sessions" ON public.shower_sessions;
DROP POLICY IF EXISTS "Anyone can update shower sessions" ON public.shower_sessions;

ALTER TABLE public.shower_sessions ENABLE ROW LEVEL SECURITY;

-- Prevent session code collisions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'shower_sessions_session_code_key'
  ) THEN
    ALTER TABLE public.shower_sessions
    ADD CONSTRAINT shower_sessions_session_code_key UNIQUE (session_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shower_sessions_last_update ON public.shower_sessions (last_update);
CREATE INDEX IF NOT EXISTS idx_shower_sessions_session_code ON public.shower_sessions (session_code);
