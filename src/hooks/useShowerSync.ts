import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/lib/constants";
import { playBing, playFinalTada } from "@/lib/sounds";

export function useShowerSync(mode: 'parent' | 'child') {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [status, setStatus] = useState<'setup' | 'waiting' | 'ready' | 'running' | 'finished'>('setup');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Initialisation
  useEffect(() => {
    if (mode === 'child' && !sessionCode) {
      const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      setSessionCode(newCode);
      supabase.from('shower_sessions').insert([{ session_code: newCode, status: 'setup', steps: [] }]).then();
    }
  }, [mode]);

  // 2. Écoute en temps réel
  useEffect(() => {
    if (!sessionCode) return;
    const channel = supabase
      .channel('shower_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shower_sessions', filter: `session_code=eq.${sessionCode}` }, 
      (payload) => {
        const data = payload.new;
        setStatus(data.status);
        if (data.steps) setSteps(data.steps.filter((s: Step) => s.active));
        setCurrentStepIndex(data.current_step_index);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionCode]);

  // 3. Logique du Timer (uniquement pour l'enfant)
  useEffect(() => {
    if (mode === 'child' && status === 'running' && steps[currentStepIndex]) {
      setTimeLeft(steps[currentStepIndex].duration);
    }
  }, [currentStepIndex, status, mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'child' && status === 'running' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStepEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, status, mode]);

  const handleStepEnd = () => {
    if (currentStepIndex < steps.length - 1) {
      playBing();
      updateSession({ current_step_index: currentStepIndex + 1 });
    } else {
      playFinalTada();
      updateSession({ status: 'finished' });
    }
  };

  const updateSession = async (newData: any) => {
    if (!sessionCode) return;
    await supabase.from('shower_sessions').update(newData).eq('session_code', sessionCode);
  };

  const joinSession = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('shower_sessions')
      .select('*')
      .eq('session_code', code.toUpperCase())
      .maybeSingle(); // Plus robuste que .single()

    if (error) {
      console.error("Erreur Supabase:", error.message);
      return false;
    }

    if (data) {
      setSessionCode(code.toUpperCase());
      // On force la mise à jour du status pour dire au Parent qu'il est connecté
      await updateSession({ status: 'waiting' }); 
      return true;
    } else {
      alert("Code non trouvé. Vérifie le code sur l'autre appareil.");
      return false;
    }
  } catch (err) {
    console.error("Erreur critique:", err);
    return false;
  }
};

  return { sessionCode, status, steps, currentStepIndex, timeLeft, updateSession, joinSession };
}