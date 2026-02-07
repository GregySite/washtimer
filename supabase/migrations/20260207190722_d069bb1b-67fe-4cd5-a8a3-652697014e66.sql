
-- Add RLS policies for shower_sessions (public access is intentional for this children's timer app)
-- RLS is already enabled, just need policies

-- Allow anyone to read sessions (needed for parent to join child's session)
CREATE POLICY "Anyone can read sessions by code"
ON public.shower_sessions
FOR SELECT
USING (true);

-- Allow anyone to create new sessions (needed for child to start a session)
CREATE POLICY "Anyone can create sessions"
ON public.shower_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update sessions (needed for parent to control child's session)
CREATE POLICY "Anyone can update sessions"
ON public.shower_sessions
FOR UPDATE
USING (true);

-- No DELETE policy - sessions cannot be deleted by users
