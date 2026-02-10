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

// Edge function URL for validated updates
const getEdgeFunctionUrl = () => {
  let supabaseUrl = '';
  try {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  } catch {
    supabaseUrl = '';
  }
  if (!supabaseUrl) {
    supabaseUrl = 'https://oezvahfwwkqsehsbcrxh.supabase.co';
  }
  return supabaseUrl + '/functions/v1/session';
};

async function patchSession(sessionCode: string, updates: Record<string, unknown>): Promise<boolean> {
  try {
    const url = getEdgeFunctionUrl() + '?code=' + encodeURIComponent(sessionCode);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch {
    return false;
  }
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
  const lastSyncRef = useRef<number>(0);

  // Calculate total duration from steps
  const calculateTotalDuration = useCallback((stepsToCalc: Step[]) => {
    return stepsToCalc.filter(s => s.active).reduce((sum, s) => sum + s.duration, 0);
  }, []);

  // Create session for child
  useEffect(() => {
    if (mode === "child" && !sessionCode) {
      const createSession = async () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        const newCode = Array.from(array, b => chars[b % chars.length]).join('');
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
          console.error("[SESSION] Creation failed");
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

  // Timer logic for BOTH modes - local countdown every second
  // Child mode: syncs to DB every 5 seconds and handles step transitions
  // Parent mode: local countdown only (realtime updates correct any drift)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === "running" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Only child syncs to DB
          if (mode === "child") {
            // Sync to DB via edge function every 5 seconds
            const now = Date.now();
            if (now - lastSyncRef.current >= 5000) {
              lastSyncRef.current = now;
              patchSession(sessionCode, { time_remaining: newTime });
            }

            // Check if step is complete
            if (newTime <= 0) {
              const active = steps.filter((s) => s.active);
              const nextIndex = currentStepIndex + 1;

              if (nextIndex < active.length) {
                const nextStepTime = active[nextIndex].duration;
                setCurrentStepIndex(nextIndex);
                setTimeRemaining(nextStepTime);
                
                patchSession(sessionCode, {
                  current_step_index: nextIndex,
                  time_remaining: nextStepTime,
                });
                  
                return nextStepTime;
              } else {
                patchSession(sessionCode, { state: "finished" });
                setStatus("finished");
                return 0;
              }
            }
          }
          
          if (newTime <= 0) return 0;
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, status, sessionCode, steps, currentStepIndex, timeRemaining]);

  // Update session via edge function
  const updateSession = useCallback(
    async (updates: SessionData) => {
      if (!sessionCode) return;

      // Update local state immediately
      if (updates.state) {
        setStatus(updates.state);
      }
      if (updates.steps) {
        setSteps(updates.steps);
        const newTotal = calculateTotalDuration(updates.steps);
        setTotalDuration(newTotal);
      }
      if (updates.current_step_index !== undefined) {
        setCurrentStepIndex(updates.current_step_index);
      }
      if (updates.time_remaining !== undefined) {
        setTimeRemaining(updates.time_remaining);
      }

      // Build payload with only edge-function-allowed fields
      const payload: Record<string, unknown> = {};
      if (updates.state) payload.state = updates.state;
      if (updates.current_step_index !== undefined) payload.current_step_index = updates.current_step_index;
      if (updates.time_remaining !== undefined) payload.time_remaining = updates.time_remaining;
      if (updates.total_duration !== undefined) payload.total_duration = updates.total_duration;
      if (updates.steps) {
        payload.steps = updates.steps;
        const newTotal = calculateTotalDuration(updates.steps);
        payload.total_duration = newTotal;
      }

      await patchSession(sessionCode, payload);
    },
    [sessionCode, calculateTotalDuration]
  );

  // Join session (parent) - read-only via SELECT is fine
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
