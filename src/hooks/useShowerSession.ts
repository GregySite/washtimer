import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShowerSession {
  id: string;
  session_code: string;
  state: 'idle' | 'running' | 'paused' | 'completed';
  current_step_index: number;
  time_remaining: number;
  total_duration: number;
  last_update: string;
}

// Get base URL for edge functions
const getEdgeFunctionUrl = () => {
  var supabaseUrl = '';
  try {
    // @ts-ignore - VITE env
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  } catch (e) {
    supabaseUrl = '';
  }
  if (!supabaseUrl) {
    supabaseUrl = 'https://oezvahfwwkqsehsbcrxh.supabase.co';
  }
  return supabaseUrl + '/functions/v1/session';
};

export const useShowerSession = () => {
  const [session, setSession] = useState<ShowerSession | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Créer une nouvelle session (iPad - hôte)
  const createSession = useCallback(async function(totalDuration: number) {
    setLoading(true);
    setError(null);
    
    try {
      var response = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_duration: totalDuration }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      var result = await response.json();
      var sessionData = result.session as ShowerSession;
      
      setSession(sessionData);
      setSessionCode(sessionData.session_code);
      setIsHost(true);
      
      // Stocker le code localement
      try {
        localStorage.setItem('shower_session_code', sessionData.session_code);
        localStorage.setItem('shower_session_id', sessionData.id);
        localStorage.setItem('shower_is_host', 'true');
      } catch (e) {
        // localStorage might not be available
      }
      
      return sessionData.session_code;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Erreur lors de la création de la session');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rejoindre une session existante (smartphone - télécommande)
  const joinSession = useCallback(async function(code: string) {
    setLoading(true);
    setError(null);
    
    try {
      var url = getEdgeFunctionUrl() + '?code=' + encodeURIComponent(code.toUpperCase());
      var response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        setError('Session non trouvée');
        return false;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      var result = await response.json();
      var sessionData = result.session as ShowerSession;

      setSession(sessionData);
      setSessionCode(code.toUpperCase());
      setIsHost(false);
      
      try {
        localStorage.setItem('shower_session_code', code.toUpperCase());
        localStorage.setItem('shower_session_id', sessionData.id);
        localStorage.setItem('shower_is_host', 'false');
      } catch (e) {
        // localStorage might not be available
      }
      
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
  const updateSession = useCallback(async function(updates: Partial<ShowerSession>) {
    if (!session) return;
    
    try {
      var url = getEdgeFunctionUrl() + '?id=' + encodeURIComponent(session.id);
      var response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      var result = await response.json();
      setSession(result.session as ShowerSession);
    } catch (err) {
      console.error('Error updating session:', err);
    }
  }, [session]);

  // Quitter la session
  const leaveSession = useCallback(function() {
    // Cleanup subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setSession(null);
    setSessionCode(null);
    setIsHost(false);
    
    try {
      localStorage.removeItem('shower_session_code');
      localStorage.removeItem('shower_session_id');
      localStorage.removeItem('shower_is_host');
    } catch (e) {
      // localStorage might not be available
    }
  }, []);

  // S'abonner aux mises à jour en temps réel
  useEffect(function() {
    if (!session) return;

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    var channel = supabase
      .channel('shower_session_' + session.id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shower_sessions',
          filter: 'id=eq.' + session.id,
        },
        function(payload) {
          console.log('Session updated:', payload.new);
          setSession(payload.new as ShowerSession);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return function() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.id]);

  // Restaurer la session au chargement
  useEffect(function() {
    var savedCode = '';
    var savedIsHost = false;
    
    try {
      savedCode = localStorage.getItem('shower_session_code') || '';
      savedIsHost = localStorage.getItem('shower_is_host') === 'true';
    } catch (e) {
      // localStorage might not be available
      return;
    }
    
    if (savedCode) {
      joinSession(savedCode).then(function(success) {
        if (success) {
          setIsHost(savedIsHost);
        }
      });
    }
  }, [joinSession]);

  return {
    session: session,
    sessionCode: sessionCode,
    isHost: isHost,
    loading: loading,
    error: error,
    createSession: createSession,
    joinSession: joinSession,
    updateSession: updateSession,
    leaveSession: leaveSession,
  };
};
