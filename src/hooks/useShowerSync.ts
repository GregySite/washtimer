import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/lib/constants";

export function useShowerSync(mode: 'parent' | 'child') {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [status, setStatus] = useState<'setup' | 'waiting' | 'ready' | 'running' | 'finished'>('setup');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Initialisation ENFANT : Créer la session
  useEffect(() => {
    if (mode === 'child' && !sessionCode) {
      const generateSession = async () => {
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const { error } = await supabase
          .from('shower_sessions')
          .insert([{ 
            session_code: newCode, 
            status: 'setup', 
            steps: [],
            current_step_index: 0 
          }]);

        if (error) {
          console.error("Erreur création session:", error.message);
          setTimeout(generateSession, 2000);
        } else {
          setSessionCode(newCode);
        }
      };
      generateSession();
    }
  }, [mode, sessionCode]);

  // 2. Écoute en temps réel (Realtime)
  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase
      .channel(`shower_${sessionCode}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shower_sessions', 
        filter: `session_code=eq.${sessionCode}` 
      }, (payload) => {
        const data = payload.new as any;
        if (!data) return;

        setStatus(data.status);
        if (data.steps) setSteps(data.steps);
        setCurrentStepIndex(data.current_step_index || 0);
        
        // CORRECTION CHRONO : Si on passe en 'running', on initialise le temps local
        if (data.status === 'running' && data.steps && data.steps.length > 0) {
          const activeSteps = data.steps.filter((s: any) => s.active);
          const currentStep = activeSteps[data.current_step_index || 0];
          if (currentStep && timeLeft === 0) {
            setTimeLeft(currentStep.duration);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionCode, timeLeft]);

  // 3. Fonctions de mise à jour
  const updateSession = async (newData: any) => {
    if (!sessionCode) return;
    
    const { error } = await supabase
      .from('shower_sessions')
      .update(newData)
      .eq('session_code', sessionCode);

    if (error) {
      console.error("Erreur mise à jour:", error.message);
    }
  };

  const joinSession = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('shower_sessions')
      .select('*')
      .eq('session_code', cleanCode)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    setSessionCode(cleanCode);
    setStatus(data.status);
    if (data.steps) setSteps(data.steps);
    return true;
  };

  return { 
    sessionCode, 
    status, 
    steps, 
    currentStepIndex, 
    timeLeft, 
    setTimeLeft, // On expose setTimeLeft pour le décompte local
    updateSession, 
    joinSession 
  };
}