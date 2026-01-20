import { useState } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Settings } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState(DEFAULT_STEPS);

  // Calculs pour l'affichage
  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];
  const totalTimeLeft = activeSteps.slice(currentStepIndex).reduce((acc, s) => acc + s.duration, 0);
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // 1. REJOINDRE (Écran 1 -> Écran 2)
  const handleJoin = async () => {
    const code = sessionInput.trim().toUpperCase();
    if (code.length < 4) return;

    const success = await joinSession(code);
    if (success) {
      // On force l'update immédiat en passant le code explicitement
      await updateSession({ status: 'waiting', steps: DEFAULT_STEPS }, code);
    } else {
      alert("Code incorrect");
    }
  };

  // 2. LANCER (Écran 2 -> Écran 3)
  const handleLaunch = async () => {
    await updateSession({ 
      status: 'running', 
      steps: localSteps, // On envoie les temps modifiés
      current_step_index: 0 
    });
  };

  // --- ÉCRAN 1 : CONNEXION ---
  // Layout remonté (pt-20) pour le clavier
  if (status === 'setup' || !sessionCode) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 pt-20 px-6 gap-6">
        <h1 className="text-2xl font-bold text-slate-800">Mode Parent</h1>
        <Card className="w-full p-6 shadow-lg border-t-4 border-blue-500">
          <label className="text-sm font-bold text-slate-500 mb-2 block">CODE DE LA DOUCHE</label>
          <Input 
            className="text-center text-4xl h-20 font-mono uppercase tracking-widest mb-6" 
            placeholder="ABCD" 
            maxLength={4}
            value={sessionInput} 
            onChange={e => setSessionInput(e.target.value.toUpperCase())} 
          />
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700" 
            onClick={handleJoin}
          >
            VALIDER
          </Button>
        </Card>
      </div>
    );
  }

  // --- ÉCRAN 2 : RÉGLAGES (WAITING) ---
  // C'est cet écran qui manquait !
  if (status === 'waiting') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pt-10 px-4 pb-32">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6"/> Réglage des temps
        </h2>
        
        <div className="space-y-3">
          {localSteps.map((step, idx) => (
            <Card key={step.id} className="p-4 flex items-center justify-between shadow-sm">
              <span className="font-bold text-slate-700">{step.label}</span>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  className="w-20 text-center font-mono text-lg h-12"
                  value={Math.round(step.duration / 60)} // On affiche en minutes
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const newSteps = [...localSteps];
                    newSteps[idx] = { ...step, duration: val * 60 };
                    setLocalSteps(newSteps);
                  }}
                />
                <span className="text-sm text-slate-400 font-medium w-8">min</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
          <Button 
            className="w-full h-20 text-2xl font-black bg-green-500 hover:bg-green-600 text-white shadow-xl rounded-xl"
            onClick={handleLaunch}
          >
            C'EST PARTI ! 🚀
          </Button>
        </div>
      </div>
    );
  }

  // --- ÉCRAN 3 : CONTRÔLE (RUNNING / PAUSED / FINISHED) ---
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-10 px-6">
      <div className="text-center mb-8">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">En cours</div>
        <div className="text-4xl font-black text-blue-600 truncate">
            {currentStep ? currentStep.label : "Terminé"}
        </div>
      </div>

      <Card className="p-6 mb-8 bg-white shadow-xl border-blue-100 border-2">
        <div className="grid grid-cols-2 gap-8 text-center divide-x">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Étape</div>
            <div className="text-3xl font-mono font-bold text-slate-800">
              {formatTime(currentStep?.duration || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total</div>
            <div className="text-3xl font-mono font-bold text-blue-500">
              {formatTime(totalTimeLeft)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mt-auto mb-10">
        {status === 'running' ? (
          <Button 
            variant="outline" 
            className="h-24 text-xl font-bold border-2 border-slate-200" 
            onClick={() => updateSession({ status: 'paused' })}
          >
            <Pause className="mr-2 w-6 h-6" /> PAUSE
          </Button>
        ) : (
          <Button 
            className="h-24 text-xl font-bold bg-green-500 hover:bg-green-600 text-white" 
            onClick={() => updateSession({ status: 'running' })}
          >
            <Play className="mr-2 w-6 h-6" /> REPRENDRE
          </Button>
        )}
        
        <Button 
          variant="destructive" 
          className="h-24 text-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 border-none" 
          onClick={() => updateSession({ status: 'setup', current_step_index: 0 })}
        >
          <Square className="mr-2 w-6 h-6 fill-current" /> STOP
        </Button>
      </div>
    </div>
  );
}