
-- Drop the restrictive policies that block all access
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.shower_sessions;
DROP POLICY IF EXISTS "Anyone can read sessions by code" ON public.shower_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.shower_sessions;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Anyone can read sessions by code"
ON public.shower_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create sessions"
ON public.shower_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
ON public.shower_sessions
FOR UPDATE
USING (true);
