-- Table pour synchroniser l'état de la douche en temps réel
CREATE TABLE public.shower_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_code TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'idle' CHECK (state IN ('idle', 'running', 'paused', 'completed')),
    current_step_index INTEGER NOT NULL DEFAULT 0,
    time_remaining INTEGER NOT NULL DEFAULT 0,
    total_duration INTEGER NOT NULL DEFAULT 600,
    last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.shower_sessions ENABLE ROW LEVEL SECURITY;

-- Politique publique pour lecture/écriture (pas besoin d'auth pour cette app enfant)
CREATE POLICY "Anyone can read shower sessions"
ON public.shower_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert shower sessions"
ON public.shower_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update shower sessions"
ON public.shower_sessions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete shower sessions"
ON public.shower_sessions
FOR DELETE
USING (true);

-- Activer realtime pour la synchronisation
ALTER PUBLICATION supabase_realtime ADD TABLE public.shower_sessions;