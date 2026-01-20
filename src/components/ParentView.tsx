import { useState } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS } from "@/lib/constants";
import { Button } from "./ui/button"; // Vérifie ce chemin
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Play, Pause, Square } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState(DEFAULT_STEPS);

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];
  
  // Calcul du temps total restant
  const totalTimeLeft = activeSteps.slice(currentStepIndex).reduce((acc, s) => acc + s.duration, 0);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleStart = async () => {
    const success = await joinSession(sessionInput);
    if (success) {
      await updateSession({ 
        status: 'running', 
        steps: localSteps, 
        current_step_index: 0 
      });
    }
  };

  if (status === 'setup' || !sessionCode) {
    return (
      <div className="p-6 flex flex-col gap-6 items-center justify-center min-h-screen bg-slate-50">
        <Input className="text-center text-4xl h-20 font-mono" placeholder="CODE" value={sessionInput} onChange={e => setSessionInput(e.target.value)} />
        <Button size="lg" className="w-full h-20 text-2xl" onClick={handleStart}>LANCER LA DOUCHE</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-8">
      <Card className="p-6 text-center space-y-4 shadow-xl border-t-8 border-blue-500">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Étape en cours</div>
        <div className="text-4xl font-black text-blue-600">{currentStep?.label || "---"}</div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Temps Étape</div>
            <div className="text-2xl font-mono font-bold text-slate-700">{formatTime(currentStep?.duration || 0)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Temps Total</div>
            <div className="text-2xl font-mono font-bold text-blue-500">{formatTime(totalTimeLeft)}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {status === 'running' ? (
          <Button variant="outline" className="h-20 border-2" onClick={() => updateSession({ status: 'paused' })}>
            <Pause className="mr-2" /> PAUSE
          </Button>
        ) : (
          <Button className="h-20 bg-green-500" onClick={() => updateSession({ status: 'running' })}>
            <Play className="mr-2" /> REPRENDRE
          </Button>
        )}
        <Button variant="destructive" className="h-20" onClick={() => updateSession({ status: 'setup', current_step_index: 0 })}>
          <Square className="mr-2" /> STOP
        </Button>
      </div>
    </div>
  );
}