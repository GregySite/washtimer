import { useEffect } from "react";
import { useShowerSync } from "../hooks/useShowerSync"; // Chemin relatif direct
import { Loader2 } from "lucide-react";

export default function ChildView() {
  const { sessionCode, status, steps, currentStepIndex, timeLeft, setTimeLeft, updateSession } = useShowerSync('child');

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
  }, [status, timeLeft, currentStepIndex]);

  // Initialisation du premier chrono
  useEffect(() => {
    if (status === 'running' && timeLeft === 0 && currentStep) {
        setTimeLeft(currentStep.duration);
    }
  }, [status]);

  if (status === 'setup') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-6 text-white">
      <div className="bg-white/20 backdrop-blur-lg p-12 rounded-[3rem] border-2 border-white/30 text-center shadow-2xl">
        <h2 className="text-2xl font-medium mb-4 opacity-90">Code Magique</h2>
        <div className="text-8xl font-black font-mono tracking-tighter mb-4">{sessionCode || "..."}</div>
        <p className="animate-pulse">En attente de Papa/Maman...</p>
      </div>
    </div>
  );

  if (status === 'running' || status === 'paused') {
    const progress = currentStep ? (timeLeft / currentStep.duration) : 0;
    const strokeDasharray = 2 * Math.PI * 120;
    const strokeDashoffset = strokeDasharray * (1 - progress);

    return (
      <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center p-8 transition-colors duration-500">
        <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-12 drop-shadow-md">
          {currentStep?.label}
        </h2>

        <div className="relative flex items-center justify-center">
          <svg className="w-80 h-80 transform -rotate-90">
            <circle cx="160" cy="160" r="120" stroke="rgba(255,255,255,0.2)" strokeWidth="20" fill="transparent" />
            <circle cx="160" cy="160" r="120" stroke="white" strokeWidth="20" fill="transparent" 
              strokeDasharray={strokeDasharray} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
          </svg>
          <div className="absolute text-7xl font-black text-white font-mono">
            {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
          </div>
        </div>

        {status === 'paused' && (
          <div className="mt-8 bg-white/20 px-6 py-2 rounded-full text-white font-bold animate-bounce">PAUSE</div>
        )}
      </div>
    );
  }

  return <div className="min-h-screen bg-yellow-400 flex items-center justify-center text-6xl font-black text-white">FINI ! 🛁</div>;
}