import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/lib/constants";

export function useShowerSync(mode: 'parent' | 'child') {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [status, setStatus] = useState<'setup' | 'waiting' | 'ready' | 'running' | 'finished'>('setup');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Initialisation ENFANT : Créer la session AVANT d'afficher le code
  useEffect(() => {
    if (mode === 'child' && !sessionCode) {
      const generateSession = async () => {
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        console.log("Tentative de création de session avec le code:", newCode);
        
        const { error } = await supabase
          .from('shower_sessions')
          .insert([{ 
            session_code: newCode, 
            status: 'setup', 
            steps: [],
            current_step_index: 0 
          }]);

        if (error) {
          console.error("Erreur Supabase à l'insertion:", error.message);
          // Si erreur, on réessaie dans 2 secondes
          setTimeout(generateSession, 2000);
        } else {
          setSessionCode(newCode);
          console.log("Session validée dans la base !");
        }
      };
      generateSession();
    }
  }, [mode, sessionCode]);

  // 2. Écoute en temps réel
  useEffect(() => {
    if (!sessionCode) return;
    const channel = supabase
      .channel(`shower_${sessionCode}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'shower_sessions', 
        filter: `session_code=eq.${sessionCode}` 
      }, (payload) => {
        const data = payload.new;
        if (data.status) setStatus(data.status);
        if (data.steps) setSteps(data.steps.filter((s: any) => s.active));
        if (data.current_step_index !== undefined) setCurrentStepIndex(data.current_step_index);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionCode]);

  const updateSession = async (newData: any) => {
    if (!sessionCode) return;
    await supabase.from('shower_sessions').update(newData).eq('session_code', sessionCode);
  };

  const joinSession = async (code: string) => {
  const cleanCode = code.trim().toUpperCase();
  console.log("Recherche de la session...", cleanCode);
  
  const { data, error } = await supabase
    .from('shower_sessions')
    .select('*')
    .eq('session_code', cleanCode)
    .maybeSingle();

  if (error) {
    console.error("Erreur de recherche:", error.message);
    return false;
  }

  if (data) {
    // FORCE LE CHANGEMENT LOCAL IMMEDIAT
    setSessionCode(cleanCode);
    setStatus(data.status); 
    console.log("Session trouvée localement !");
    return true;
  }
  
  return false;
};

  return { sessionCode, status, steps, currentStepIndex, timeLeft, updateSession, joinSession };
}