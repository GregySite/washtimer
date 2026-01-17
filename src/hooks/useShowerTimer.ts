import { useState, useEffect, useCallback } from "react";
import { ShowerStep } from "@/components/StepDisplay";

const createSteps = (totalDuration: number): ShowerStep[] => {
  // Distribute time: 15% rinse, 25% shampoo, 35% soap, 25% final rinse
  const rinseTime = Math.floor(totalDuration * 0.15);
  const shampooTime = Math.floor(totalDuration * 0.25);
  const soapTime = Math.floor(totalDuration * 0.35);
  const finalTime = totalDuration - rinseTime - shampooTime - soapTime;

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

type ShowerState = "idle" | "running" | "paused" | "completed";

export const useShowerTimer = (totalDuration: number) => {
  const [state, setState] = useState<ShowerState>("idle");
  const [steps, setSteps] = useState<ShowerStep[]>(() => createSteps(totalDuration));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Update steps when duration changes
  useEffect(() => {
    setSteps(createSteps(totalDuration));
  }, [totalDuration]);

  const currentStep = steps[currentStepIndex];
  
  const totalProgress = (totalElapsed / totalDuration) * 100;

  const start = useCallback(() => {
    setSteps(createSteps(totalDuration));
    setCurrentStepIndex(0);
    setTimeRemaining(createSteps(totalDuration)[0].duration);
    setTotalElapsed(0);
    setState("running");
  }, [totalDuration]);

  const pause = useCallback(() => {
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    setState("running");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setCurrentStepIndex(0);
    setTimeRemaining(0);
    setTotalElapsed(0);
  }, []);

  useEffect(() => {
    if (state !== "running") return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next step
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((i) => i + 1);
            return steps[currentStepIndex + 1].duration;
          } else {
            setState("completed");
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state, currentStepIndex, steps]);

  return {
    state,
    currentStep,
    timeRemaining,
    totalProgress,
    start,
    pause,
    resume,
    reset,
  };
};
