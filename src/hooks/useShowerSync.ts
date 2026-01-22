import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Step, DEFAULT_STEPS } from "@/lib/constants";

export type SessionStatus = "setup" | "waiting" | "ready" | "running" | "paused" | "finished";

export interface SessionData {
  id?: string;
  session_code?: string;
  state?: SessionStatus;
  steps?: Step[];
  current_step_index?: number;
  time_remaining?: number;
  total_duration?: number;
  last_update?: string;
}

export function useShowerSync(mode: "parent" | "child") {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [status, setStatus] = useState<SessionStatus>("setup");
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>("");

  // Calculate total duration from steps
  const calculateTotalDuration = useCallback((stepsToCalc: Step[]) => {
    return stepsToCalc.filter(s => s.active).reduce((sum, s) => sum + s.duration, 0);
  }, []);

  // Create session for child
  useEffect(() => {
    if (mode === "child" && !sessionCode) {
      const createSession = async () => {
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const total = calculateTotalDuration(DEFAULT_STEPS);
        
        const { data, error } = await supabase
          .from("shower_sessions")
          .insert({
            session_code: newCode,
            state: "setup",
            steps: DEFAULT_STEPS as any,
            current_step_index: 0,
            time_remaining: 0,
            total_duration: total,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating session:", error);
          setTimeout(createSession, 2000);
        } else if (data) {
          setSessionId(data.id);
          setSessionCode(newCode);
          setTotalDuration(total);
        }
      };
      createSession();
    }
  }, [mode, sessionCode, calculateTotalDuration]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase
      .channel(`shower_${sessionCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shower_sessions",
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const data = payload.new as any;
          if (!data || data.last_update === lastUpdateRef.current) return;
          
          lastUpdateRef.current = data.last_update;
          setStatus(data.state as SessionStatus);
          setSteps(data.steps || DEFAULT_STEPS);
          setCurrentStepIndex(data.current_step_index || 0);
          setTimeRemaining(data.time_remaining || 0);
          setTotalDuration(data.total_duration || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  // Timer logic for CHILD mode only
  useEffect(() => {
    if (mode !== "child") return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === "running" && timeRemaining > 0) {
      timerRef.current = setInterval(async () => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Update database every second
          supabase
            .from("shower_sessions")
            .update({ 
              time_remaining: newTime,
              last_update: new Date().toISOString()
            })
            .eq("session_code", sessionCode)
            .then();

          // Check if step is complete
          if (newTime <= 0) {
            const activeSteps = steps.filter((s) => s.active);
            const nextIndex = currentStepIndex + 1;

            if (nextIndex < activeSteps.length) {
              const nextStepTime = activeSteps[nextIndex].duration;
              setCurrentStepIndex(nextIndex);
              setTimeRemaining(nextStepTime);
              
              supabase
                .from("shower_sessions")
                .update({
                  current_step_index: nextIndex,
                  time_remaining: nextStepTime,
                  last_update: new Date().toISOString()
                })
                .eq("session_code", sessionCode)
                .then();
                
              return nextStepTime;
            } else {
              // Session complete
              supabase
                .from("shower_sessions")
                .update({ 
                  state: "finished",
                  last_update: new Date().toISOString()
                })
                .eq("session_code", sessionCode)
                .then();
              setStatus("finished");
              return 0;
            }
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, status, sessionCode, steps, currentStepIndex]);

  // Update session
  const updateSession = useCallback(
    async (updates: SessionData) => {
      if (!sessionCode) return;

      const payload: any = {
        ...updates,
        last_update: new Date().toISOString(),
      };
      
      // Rename state to match DB
      if (updates.state) {
        payload.state = updates.state;
        setStatus(updates.state);
      }
      if (updates.steps) {
        payload.steps = updates.steps;
        setSteps(updates.steps);
        const newTotal = calculateTotalDuration(updates.steps);
        setTotalDuration(newTotal);
        payload.total_duration = newTotal;
      }
      if (updates.current_step_index !== undefined) {
        setCurrentStepIndex(updates.current_step_index);
      }
      if (updates.time_remaining !== undefined) {
        setTimeRemaining(updates.time_remaining);
      }

      await supabase
        .from("shower_sessions")
        .update(payload)
        .eq("session_code", sessionCode);
    },
    [sessionCode, calculateTotalDuration]
  );

  // Join session (parent)
  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    
    const { data, error } = await supabase
      .from("shower_sessions")
      .select("*")
      .eq("session_code", cleanCode)
      .maybeSingle();

    if (error || !data) return false;

    setSessionId(data.id);
    setSessionCode(cleanCode);
    setStatus(data.state as SessionStatus);
    setSteps((data.steps as unknown as Step[]) || DEFAULT_STEPS);
    setCurrentStepIndex(data.current_step_index || 0);
    setTimeRemaining(data.time_remaining || 0);
    setTotalDuration(data.total_duration || 0);
    
    return true;
  }, []);

  // Start shower
  const startShower = useCallback(async () => {
    const activeSteps = steps.filter((s) => s.active);
    if (activeSteps.length === 0) return;

    const firstStepDuration = activeSteps[0].duration;
    const total = calculateTotalDuration(steps);

    await updateSession({
      state: "running",
      current_step_index: 0,
      time_remaining: firstStepDuration,
      total_duration: total,
      steps: steps,
    });
  }, [steps, updateSession, calculateTotalDuration]);

  return {
    sessionCode,
    status,
    steps,
    currentStepIndex,
    timeRemaining,
    totalDuration,
    updateSession,
    joinSession,
    startShower,
    setSteps,
  };
}
