import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { Step } from "../lib/constants";

export function useShowerSync(mode: 'parent' | 'child') {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [status, setStatus] = useState<'setup' | 'waiting' | 'ready' | 'running' | 'paused' | 'finished'>('setup');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (mode === 'child' && !sessionCode) {
      const generateSession = async () => {
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const { error } = await supabase.from('shower_sessions').insert([{ 
          session_code: newCode, status: 'setup', steps: [], current_step_index: 0 
        }]);
        if (!error) setSessionCode(newCode);
        else setTimeout(generateSession, 2000);
      };
      generateSession();
    }
  }, [mode, sessionCode]);

  useEffect(() => {
    if (!sessionCode) return;
    const channel = supabase.channel(`shower_${sessionCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shower_sessions', filter: `session_code=eq.${sessionCode}` }, 
      (payload) => {
        const data = payload.new as any;
        if (!data) return;
        setStatus(data.status);
        if (data.steps) setSteps(data.steps);
        setCurrentStepIndex(data.current_step_index || 0);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionCode]);

  const updateSession = async (newData: any) => {
    if (!sessionCode) return;
    await supabase.from('shower_sessions').update(newData).eq('session_code', sessionCode);
  };

  const joinSession = async (code: string) => {
  const cleanCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('shower_sessions')
    .select('*')
    .eq('session_code', cleanCode)
    .maybeSingle();

  if (error) {
    console.error("Erreur Supabase:", error.message);
    return false;
  }

  if (data) {
    setSessionCode(cleanCode);
    setStatus(data.status);
    // On met à jour les étapes locales avec celles de la base
    if (data.steps) setSteps(data.steps);
    return true;
  }
  return false;
};

  return { sessionCode, status, steps, currentStepIndex, timeLeft, setTimeLeft, updateSession, joinSession };
}