import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ShowerSession {
  id: string;
  session_code: string;
  state: 'idle' | 'running' | 'paused' | 'completed';
  current_step_index: number;
  time_remaining: number;
  total_duration: number;
  last_update: string;
}

// Génère un code de session court et lisible
const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useShowerSession = () => {
  const [session, setSession] = useState<ShowerSession | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer une nouvelle session (iPad - hôte)
  const createSession = useCallback(async (totalDuration: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const code = generateSessionCode();
      
      const { data, error: insertError } = await supabase
        .from('shower_sessions')
        .insert({
          session_code: code,
          state: 'idle',
          current_step_index: 0,
          time_remaining: totalDuration,
          total_duration: totalDuration,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSession(data as ShowerSession);
      setSessionCode(code);
      setIsHost(true);
      
      // Stocker le code localement
      localStorage.setItem('shower_session_code', code);
      localStorage.setItem('shower_is_host', 'true');
      
      return code;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Erreur lors de la création de la session');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rejoindre une session existante (smartphone - télécommande)
  const joinSession = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('shower_sessions')
        .select()
        .eq('session_code', code.toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Session non trouvée');
        return false;
      }

      setSession(data as ShowerSession);
      setSessionCode(code.toUpperCase());
      setIsHost(false);
      
      localStorage.setItem('shower_session_code', code.toUpperCase());
      localStorage.setItem('shower_is_host', 'false');
      
      return true;
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Erreur lors de la connexion à la session');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour l'état de la session
  const updateSession = useCallback(async (updates: Partial<ShowerSession>) => {
    if (!session) return;
    
    try {
      const { error: updateError } = await supabase
        .from('shower_sessions')
        .update({
          ...updates,
          last_update: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating session:', err);
    }
  }, [session]);

  // Quitter la session
  const leaveSession = useCallback(() => {
    setSession(null);
    setSessionCode(null);
    setIsHost(false);
    localStorage.removeItem('shower_session_code');
    localStorage.removeItem('shower_is_host');
  }, []);

  // S'abonner aux mises à jour en temps réel
  useEffect(() => {
    if (!session) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`shower_session_${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'shower_sessions',
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            console.log('Session updated:', payload.new);
            setSession(payload.new as ShowerSession);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.id]);

  // Restaurer la session au chargement
  useEffect(() => {
    const savedCode = localStorage.getItem('shower_session_code');
    const savedIsHost = localStorage.getItem('shower_is_host') === 'true';
    
    if (savedCode) {
      joinSession(savedCode).then((success) => {
        if (success) {
          setIsHost(savedIsHost);
        }
      });
    }
  }, [joinSession]);

  return {
    session,
    sessionCode,
    isHost,
    loading,
    error,
    createSession,
    joinSession,
    updateSession,
    leaveSession,
  };
};
