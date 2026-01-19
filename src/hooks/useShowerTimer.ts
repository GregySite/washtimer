import { useState, useEffect, useCallback, useRef } from "react";
import { ShowerStep } from "@/components/StepDisplay";

var createSteps = function(totalDuration: number): ShowerStep[] {
  // Distribute time: 15% rinse, 25% shampoo, 35% soap, 25% final rinse
  var rinseTime = Math.floor(totalDuration * 0.15);
  var shampooTime = Math.floor(totalDuration * 0.25);
  var soapTime = Math.floor(totalDuration * 0.35);
  var finalTime = totalDuration - rinseTime - shampooTime - soapTime;

  return [
    {
      id: 1,
      name: "Rinçage",
      icon: "rinse" as const,
      duration: rinseTime,
      color: "hsl(195, 85%, 55%)",
      instruction: "Mouille-toi bien de la tête aux pieds !",
    },
    {
      id: 2,
      name: "Shampooing",
      icon: "shampoo" as const,
      duration: shampooTime,
      color: "hsl(280, 60%, 65%)",
      instruction: "Frotte bien tes cheveux avec le shampooing !",
    },
    {
      id: 3,
      name: "Savonnage",
      icon: "soap" as const,
      duration: soapTime,
      color: "hsl(340, 60%, 70%)",
      instruction: "Lave tout ton corps avec le gel douche !",
    },
    {
      id: 4,
      name: "Rinçage final",
      icon: "final" as const,
      duration: finalTime,
      color: "hsl(140, 70%, 50%)",
      instruction: "Rince bien tes cheveux et ton corps !",
    },
  ];
};

export type ShowerState = "idle" | "running" | "paused" | "completed";

interface UseShowerTimerOptions {
  onStateChange?: (state: ShowerState, stepIndex: number, timeRemaining: number) => void;
}

export var useShowerTimer = function(totalDuration: number, options?: UseShowerTimerOptions) {
  var stateResult = useState<ShowerState>("idle");
  var state = stateResult[0];
  var setState = stateResult[1];
  
  var stepsResult = useState<ShowerStep[]>(function() { return createSteps(totalDuration); });
  var steps = stepsResult[0];
  var setSteps = stepsResult[1];
  
  var stepIndexResult = useState(0);
  var currentStepIndex = stepIndexResult[0];
  var setCurrentStepIndex = stepIndexResult[1];
  
  var timeResult = useState(0);
  var timeRemaining = timeResult[0];
  var setTimeRemaining = timeResult[1];
  
  var elapsedResult = useState(0);
  var totalElapsed = elapsedResult[0];
  var setTotalElapsed = elapsedResult[1];
  
  var onStateChangeRef = useRef(options?.onStateChange);
  onStateChangeRef.current = options?.onStateChange;

  // Update steps when duration changes
  useEffect(function() {
    setSteps(createSteps(totalDuration));
  }, [totalDuration]);

  var currentStep = steps[currentStepIndex];
  
  var totalProgress = (totalElapsed / totalDuration) * 100;

  // Notify on state changes
  useEffect(function() {
    if (onStateChangeRef.current) {
      onStateChangeRef.current(state, currentStepIndex, timeRemaining);
    }
  }, [state, currentStepIndex, timeRemaining]);

  var start = useCallback(function() {
    var newSteps = createSteps(totalDuration);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setTimeRemaining(newSteps[0].duration);
    setTotalElapsed(0);
    setState("running");
  }, [totalDuration]);

  var pause = useCallback(function() {
    setState("paused");
  }, []);

  var resume = useCallback(function() {
    setState("running");
  }, []);

  var reset = useCallback(function() {
    setState("idle");
    setCurrentStepIndex(0);
    setTimeRemaining(0);
    setTotalElapsed(0);
  }, []);

  // Sync state from remote (for host receiving remote commands)
  var syncFromRemote = useCallback(function(newState: ShowerState, stepIndex?: number, newTimeRemaining?: number) {
    if (newState === 'running' && state === 'idle') {
      start();
    } else if (newState === 'paused' && state === 'running') {
      pause();
    } else if (newState === 'running' && state === 'paused') {
      resume();
    } else if (newState === 'idle' && (state === 'running' || state === 'paused' || state === 'completed')) {
      reset();
    } else {
      setState(newState);
      if (stepIndex !== undefined) setCurrentStepIndex(stepIndex);
      if (newTimeRemaining !== undefined) setTimeRemaining(newTimeRemaining);
    }
  }, [state, start, pause, resume, reset]);

  useEffect(function() {
    if (state !== "running") return;

    var interval = setInterval(function() {
      setTimeRemaining(function(prev) {
        if (prev <= 1) {
          // Move to next step
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(function(i) { return i + 1; });
            return steps[currentStepIndex + 1].duration;
          } else {
            setState("completed");
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed(function(prev) { return prev + 1; });
    }, 1000);

    return function() { clearInterval(interval); };
  }, [state, currentStepIndex, steps]);

  return {
    state: state,
    currentStep: currentStep,
    currentStepIndex: currentStepIndex,
    timeRemaining: timeRemaining,
    totalProgress: totalProgress,
    totalDuration: totalDuration,
    start: start,
    pause: pause,
    resume: resume,
    reset: reset,
    syncFromRemote: syncFromRemote,
  };
};
