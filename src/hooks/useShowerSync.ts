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

// Persistence keys
const STORAGE_KEY_MODE = 'timewash_mode';
const STORAGE_KEY_CODE = 'timewash_session_code';

export function useShowerSync(mode: "parent" | "child") {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>(() => {
    // Restore session code from localStorage on mount
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    if (savedMode === mode) {
      return localStorage.getItem(STORAGE_KEY_CODE) || "";
    }
    return "";
  });
  const [status, setStatus] = useState<SessionStatus>("setup");
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Refs for timer closure - avoids stale state bugs
  const stepsRef = useRef(steps);
  const currentStepIndexRef = useRef(currentStepIndex);
  const statusRef = useRef(status);
  const sessionCodeRef = useRef(sessionCode);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);
  const lastUpdateRef = useRef<string>("");

  // Keep refs in sync
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { sessionCodeRef.current = sessionCode; }, [sessionCode]);

  // Persist session code
  useEffect(() => {
    if (sessionCode) {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
      localStorage.setItem(STORAGE_KEY_CODE, sessionCode);
    }
  }, [sessionCode, mode]);

  const calculateTotalDuration = useCallback((stepsToCalc: Step[]) => {
    return stepsToCalc.filter(s => s.active).reduce((sum, s) => sum + s.duration, 0);
  }, []);

  // Apply full session data from DB
  const applySessionData = useCallback((data: any) => {
    if (!data) return;
    lastUpdateRef.current = data.last_update || "";
    setStatus(data.state as SessionStatus);
    const dbSteps = (data.steps as unknown as Step[]) || DEFAULT_STEPS;
    setSteps(dbSteps);
    setCurrentStepIndex(data.current_step_index || 0);
    setTimeRemaining(data.time_remaining || 0);
    setTotalDuration(data.total_duration || 0);
  }, []);

  // Fetch current session from DB (used for reconnection/visibility)
  const fetchSession = useCallback(async (code: string) => {
    const { data } = await supabase
      .from("shower_sessions")
      .select("*")
      .eq("session_code", code)
      .maybeSingle();
    if (data) applySessionData(data);
  }, [applySessionData]);

  // Create session for child (or restore existing)
  useEffect(() => {
    if (mode !== "child") return;

    if (sessionCode) {
      // Restore existing session
      fetchSession(sessionCode);
      return;
    }

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
  }, [mode, sessionCode, calculateTotalDuration, fetchSession]);

  // Restore parent session on mount
  useEffect(() => {
    if (mode === "parent" && sessionCode) {
      fetchSession(sessionCode);
    }
  }, [mode]); // intentionally only on mount

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
          applySessionData(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, applySessionData]);

  // Visibility change: re-fetch session when tab becomes visible
  useEffect(() => {
    if (!sessionCode) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSession(sessionCode);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [sessionCode, fetchSession]);

  // Timer logic - uses refs to avoid stale closures
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status !== "running") return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Step complete - only child drives transitions
          if (mode === "child") {
            const active = stepsRef.current.filter((s) => s.active);
            const nextIndex = currentStepIndexRef.current + 1;

            if (nextIndex < active.length) {
              const nextStepTime = active[nextIndex].duration;
              setCurrentStepIndex(nextIndex);
              currentStepIndexRef.current = nextIndex;

              patchSession(sessionCodeRef.current, {
                current_step_index: nextIndex,
                time_remaining: nextStepTime,
              });

              return nextStepTime;
            } else {
              setStatus("finished");
              statusRef.current = "finished";
              patchSession(sessionCodeRef.current, { state: "finished" });
              return 0;
            }
          }
          return 0;
        }

        const newTime = prev - 1;

        // Child syncs time to DB every 5 seconds
        if (mode === "child") {
          const now = Date.now();
          if (now - lastSyncRef.current >= 5000) {
            lastSyncRef.current = now;
            patchSession(sessionCodeRef.current, { time_remaining: newTime });
          }
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode]); // minimal deps - rest via refs

  // Update session via edge function
  const updateSession = useCallback(
    async (updates: SessionData) => {
      if (!sessionCode) return;

      // Update local state immediately
      if (updates.state) setStatus(updates.state);
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

      // Build payload
      const payload: Record<string, unknown> = {};
      if (updates.state) payload.state = updates.state;
      if (updates.current_step_index !== undefined) payload.current_step_index = updates.current_step_index;
      if (updates.time_remaining !== undefined) payload.time_remaining = updates.time_remaining;
      if (updates.total_duration !== undefined) payload.total_duration = updates.total_duration;
      if (updates.steps) {
        payload.steps = updates.steps;
        payload.total_duration = calculateTotalDuration(updates.steps);
      }

      await patchSession(sessionCode, payload);
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
    applySessionData(data);

    return true;
  }, [applySessionData]);

  // Start shower - accepts optional steps override to avoid race condition
  const startShower = useCallback(async (overrideSteps?: Step[]) => {
    const stepsToUse = overrideSteps || steps;
    const activeSteps = stepsToUse.filter((s) => s.active);
    if (activeSteps.length === 0) return;

    const firstStepDuration = activeSteps[0].duration;
    const total = calculateTotalDuration(stepsToUse);

    await updateSession({
      state: "running",
      current_step_index: 0,
      time_remaining: firstStepDuration,
      total_duration: total,
      steps: stepsToUse,
    });
  }, [steps, updateSession, calculateTotalDuration]);

  // Clear session (for mode switching)
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_MODE);
    localStorage.removeItem(STORAGE_KEY_CODE);
    setSessionCode("");
    setSessionId("");
    setStatus("setup");
  }, []);

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
    clearSession,
  };
}
