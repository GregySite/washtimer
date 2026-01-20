import { useEffect } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { Loader2 } from "lucide-react";
import { IconHelper } from "./ui/IconHelper"; // Import du helper

export default function ChildView() {
  const { sessionCode, status, steps, currentStepIndex, timeLeft, setTimeLeft, updateSession } = useShowerSync('child');

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];

  // Le compte à rebours local
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

  // Initialisation forcée au premier lancement pour éviter le bug du "0:00" ou du timer faux
  useEffect(() => {
    if (status === 'running' && currentStep && timeLeft === 0) {
        setTimeLeft(currentStep.duration);
    }
  }, [status, currentStep]);

  // ÉCRAN D'ATTENTE
  if (status === 'setup' || status === 'waiting' || status === 'ready') return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-400 to-blue-600 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="bg-white/10 backdrop-blur-md p-12 rounded-[3rem] border border-white/30 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 opacity-90 uppercase tracking-widest">Code Magique</h2>
        <div className="text-8xl font-black font-mono mb-8 tracking-tighter drop-shadow-md">
          {sessionCode || <Loader2 className="animate-spin mx-auto"/>}
        </div>
        <div className="flex items-center justify-center gap-2 animate-pulse bg-white/20 py-2 px-6 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <p className="font-bold text-sm">En attente de Papa/Maman...</p>
        </div>
      </div>
    </div>
  );

  // ÉCRAN DOUCHE EN COURS
  if (status === 'running' || status === 'paused') {
    // Calcul de la progression (inverse car on décompte)
    // On s'assure que duration n'est jamais 0 pour éviter division par zéro
    const maxDuration = currentStep?.duration || 1;
    const progress = timeLeft / maxDuration; 
    
    // Le cercle SVG (périmètre = 2 * PI * r) -> r=120 -> env 753.98
    const strokeDasharray = 2 * Math.PI * 120;
    const strokeDashoffset = strokeDasharray * (1 - progress);

    return (
      <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center p-8 transition-colors duration-700 ease-in-out relative overflow-hidden">
        {/* Bulles décoratives en fond */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-700"></div>

        {/* Titre et Icône */}
        <div className="z-10 text-center mb-10">
          <div className="mx-auto bg-white/20 p-6 rounded-full w-24 h-24 flex items-center justify-center mb-4 backdrop-blur shadow-lg">
             <IconHelper name={currentStep?.icon || 'Timer'} className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white uppercase tracking-wider drop-shadow-lg leading-tight">
            {currentStep?.label}
          </h2>
        </div>

        {/* Timer Circulaire */}
        <div className="relative flex items-center justify-center z-10 scale-110">
          <svg className="w-80 h-80 transform -rotate-90 drop-shadow-2xl">
            {/* Fond du cercle */}
            <circle cx="160" cy="160" r="120" stroke="rgba(255,255,255,0.15)" strokeWidth="24" fill="transparent" />
            {/* Cercle de progression */}
            <circle 
              cx="160" cy="160" r="120" 
              stroke="white" 
              strokeWidth="24" 
              fill="transparent" 
              strokeDasharray={strokeDasharray} 
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-7xl font-black text-white font-mono tracking-tighter drop-shadow-md">
              {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
            </div>
          </div>
        </div>

        {status === 'paused' && (
          <div className="mt-12 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-full font-black text-xl shadow-xl animate-bounce z-20">
            PAUSE ⏸
          </div>
        )}
      </div>
    );
  }

  // ÉCRAN FIN
  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="bg-white/20 p-8 rounded-full mb-8 animate-bounce">
        <IconHelper name="Smile" className="w-32 h-32 text-white" />
      </div>
      <h2 className="text-6xl font-black mb-4 drop-shadow-lg">BRAVO !</h2>
      <p className="text-2xl font-bold opacity-90">Tu es tout propre ! ✨</p>
    </div>
  );
}