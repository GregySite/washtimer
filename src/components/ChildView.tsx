import { useEffect } from "react";
import { useShowerSync } from "../hooks/useShowerSync";
import { Loader2 } from "lucide-react";

export default function ChildView() {
  const { sessionCode, status, steps, currentStepIndex, timeLeft, setTimeLeft, updateSession } = useShowerSync('child');

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];

  useEffect(() => {
    let interval: any;
    if (status === 'running' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === 'running' && timeLeft === 0 && currentStep) {
      if (currentStepIndex < activeSteps.length - 1) {
        const nextIndex = currentStepIndex + 1;
        updateSession({ current_step_index: nextIndex });
        setTimeLeft(activeSteps[nextIndex].duration);
      } else {
        updateSession({ status: 'finished' });
      }
    }
    return () => clearInterval(interval);
  }, [status, timeLeft, currentStepIndex, activeSteps.length]);

  useEffect(() => {
    if (status === 'running' && timeLeft === 0 && currentStep) {
        setTimeLeft(currentStep.duration);
    }
  }, [status, currentStep]);

  if (status === 'setup') return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white text-center">
      <div className="bg-white/10 p-12 rounded-[3rem] border border-white/20">
        <h2 className="text-xl mb-4 opacity-80">Ton code :</h2>
        <div className="text-8xl font-black font-mono mb-4">{sessionCode || <Loader2 className="animate-spin mx-auto"/>}</div>
        <p className="animate-pulse">Attends Papa ou Maman...</p>
      </div>
    </div>
  );

  if (status === 'running' || status === 'paused') {
    const progress = currentStep ? (timeLeft / currentStep.duration) : 0;
    const strokeDasharray = 2 * Math.PI * 120;
    const strokeDashoffset = strokeDasharray * (1 - progress);

    return (
      <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center p-8">
        <h2 className="text-4xl font-black text-white uppercase mb-12">{currentStep?.label}</h2>
        <div className="relative flex items-center justify-center">
          <svg className="w-80 h-80 transform -rotate-90">
            <circle cx="160" cy="160" r="120" stroke="rgba(255,255,255,0.2)" strokeWidth="20" fill="transparent" />
            <circle cx="160" cy="160" r="120" stroke="white" strokeWidth="20" fill="transparent" 
              strokeDasharray={strokeDasharray} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute text-7xl font-black text-white font-mono">
            {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'finished') return <div className="min-h-screen bg-green-500 flex items-center justify-center text-6xl font-black text-white text-center p-6">🛁 C'EST FINI ! BRAVO !</div>;

  return <div className="min-h-screen bg-blue-400 flex items-center justify-center text-white italic">En attente...</div>;
}