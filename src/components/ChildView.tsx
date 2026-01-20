import { useEffect } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, Timer } from "lucide-react";

export default function ChildView() {
  const { sessionCode, status, steps, currentStepIndex, timeLeft, setTimeLeft, updateSession } = useShowerSync('child');

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // LOGIQUE DU COMPTE À REBOURS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status === 'running' && timeLeft === 0) {
      // Passage à l'étape suivante quand le temps est fini
      if (currentStepIndex < steps.length - 1) {
        const nextIndex = currentStepIndex + 1;
        updateSession({ 
          current_step_index: nextIndex,
          // On pourrait ajouter un son ici !
        });
        // Le Hook mettra à jour timeLeft automatiquement grâce à notre modif précédente
      } else {
        updateSession({ status: 'finished' });
      }
    }

    return () => clearInterval(interval);
  }, [status, timeLeft, currentStepIndex, steps.length]);

  // ÉCRAN 1 : AFFICHAGE DU CODE (SETUP)
  if (status === 'setup') {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
        <Card className="p-12 shadow-2xl border-none rounded-3xl bg-white/90 backdrop-blur">
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Code de connexion</h2>
          <div className="text-7xl font-black tracking-tighter text-blue-600 font-mono mb-8">
            {sessionCode || <Loader2 className="animate-spin mx-auto" />}
          </div>
          <p className="text-blue-400 font-medium">En attente du Parent...</p>
        </Card>
      </div>
    );
  }

  // ÉCRAN 2 : ATTENTE CONFIGURATION (WAITING)
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-blue-900">Le parent prépare la douche...</h2>
      </div>
    );
  }

  // ÉCRAN 3 : PRÊT À LANCER (READY)
  if (status === 'ready') {
    return (
      <div className="min-h-screen bg-green-400 flex flex-col items-center justify-center p-6 text-center">
        <Button 
          onClick={() => updateSession({ status: 'running' })}
          className="w-64 h-64 rounded-full bg-white text-green-600 text-4xl font-black shadow-2xl hover:scale-105 transition-transform"
        >
          JE SUIS<br/>PRÊT !
        </Button>
      </div>
    );
  }

  // ÉCRAN 4 : LA DOUCHE EN COURS (RUNNING)
  if (status === 'running') {
    const currentStep = steps[currentStepIndex];
    return (
      <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-between p-12 text-white">
        <div className="text-3xl font-bold opacity-80 uppercase tracking-widest">
          {currentStep?.label}
        </div>
        
        <div className="text-[15rem] font-black leading-none font-mono">
          {formatTime(timeLeft)}
        </div>

        <div className="w-full max-w-md bg-blue-400/30 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-1000" 
            style={{ width: `${(timeLeft / (currentStep?.duration || 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // ÉCRAN 5 : TERMINÉ
  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 className="w-32 h-32 text-white mb-6" />
      <h2 className="text-5xl font-black text-white mb-8">BRAVO !</h2>
      <p className="text-yellow-900 text-xl">Tu es tout propre !</p>
    </div>
  );
}