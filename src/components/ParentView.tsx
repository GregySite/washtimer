import { useState, useEffect } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Settings, Clock } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState(DEFAULT_STEPS);
  
  // Timer local pour l'affichage Parent
  const [localTimer, setLocalTimer] = useState(0);

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];

  // Synchronisation du timer local quand l'étape change ou qu'on reprend
  useEffect(() => {
    if (status === 'running' && currentStep) {
      // Si on vient de changer d'étape, on réinitialise le timer local
      // Note: Idéalement on récupérerait le timeLeft réel via Supabase, 
      // mais pour la fluidité on simule ici.
      if (localTimer === 0) setLocalTimer(currentStep.duration);
      
      const interval = setInterval(() => {
        setLocalTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, currentStepIndex, currentStep]);

  const formatTime = (s: number) => {
    if (s < 0) s = 0;
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  };

  const handleJoin = async () => {
    const code = sessionInput.trim().toUpperCase();
    if (code.length < 4) return;
    const success = await joinSession(code);
    if (success) {
      await updateSession({ status: 'waiting', steps: DEFAULT_STEPS }, code);
    } else {
      alert("Code introuvable !");
    }
  };

  const handleLaunch = async () => {
    await updateSession({ 
      status: 'running', 
      steps: localSteps, 
      current_step_index: 0 
    });
    setLocalTimer(localSteps.filter(s => s.active)[0]?.duration || 0);
  };

  // --- ÉCRAN 1 : LOGIN ---
  if (status === 'setup' || !sessionCode) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-slate-50 pt-20 px-6 gap-6">
        <h1 className="text-3xl font-black text-blue-600">DOUCHE PARENT 🛁</h1>
        <Card className="w-full p-8 shadow-xl border-none bg-white rounded-3xl">
          <label className="text-xs font-bold text-slate-400 mb-2 block tracking-widest">CODE ENFANT</label>
          <Input 
            className="text-center text-5xl h-24 font-mono uppercase font-black mb-6 border-2 border-blue-100 rounded-2xl" 
            placeholder="ABCD" 
            maxLength={4}
            value={sessionInput} 
            onChange={e => setSessionInput(e.target.value.toUpperCase())} 
          />
          <Button size="lg" className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-500 rounded-xl" onClick={handleJoin}>
            CONNECTER
          </Button>
        </Card>
      </div>
    );
  }

  // --- ÉCRAN 2 : RÉGLAGES MINUTÉS ---
  if (status === 'waiting') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pt-8 px-4 pb-32">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500"/> CONFIGURATION
        </h2>
        
        <div className="space-y-3">
          {localSteps.map((step, idx) => {
            const minutes = Math.floor(step.duration / 60);
            const seconds = step.duration % 60;

            return (
              <Card key={step.id} className="p-4 flex flex-col gap-3 shadow-sm border-none bg-white rounded-2xl">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                  <span className="font-bold text-slate-700 text-lg">{step.label}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl flex-1">
                    <Input 
                      type="number" 
                      className="text-center font-mono font-bold text-xl h-10 bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                      value={minutes}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 0;
                        const newSteps = [...localSteps];
                        newSteps[idx].duration = (m * 60) + seconds;
                        setLocalSteps(newSteps);
                      }}
                    />
                    <span className="text-xs font-bold text-slate-400">MIN</span>
                  </div>
                  <span className="font-black text-slate-300">:</span>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl flex-1">
                    <Input 
                      type="number" 
                      className="text-center font-mono font-bold text-xl h-10 bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                      value={seconds}
                      onChange={(e) => {
                        const s = parseInt(e.target.value) || 0;
                        const newSteps = [...localSteps];
                        newSteps[idx].duration = (minutes * 60) + s;
                        setLocalSteps(newSteps);
                      }}
                    />
                    <span className="text-xs font-bold text-slate-400">SEC</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur border-t z-50">
          <Button 
            className="w-full h-20 text-2xl font-black bg-green-500 hover:bg-green-400 text-white shadow-xl rounded-2xl transition-all active:scale-95"
            onClick={handleLaunch}
          >
            LANCER LA DOUCHE 🚀
          </Button>
        </div>
      </div>
    );
  }

  // --- ÉCRAN 3 : MONITORING ---
  return (
    <div className="flex flex-col min-h-screen bg-white pt-10 px-6">
      <div className="text-center mb-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10"></div>
        <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 border border-blue-100 inline-block px-3 py-1 rounded-full bg-white">
          ÉTAPE {currentStepIndex + 1} / {activeSteps.length}
        </div>
        <div className="text-4xl font-black text-slate-800 mt-4 leading-tight">
            {currentStep ? currentStep.label : "Terminé !"}
        </div>
      </div>

      {status !== 'finished' && (
        <div className="flex items-center justify-center py-10">
          <div className="relative">
            {/* Cercle décoratif */}
            <svg className="w-64 h-64 transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
              <circle 
                cx="128" cy="128" r="120" stroke="#3b82f6" strokeWidth="8" fill="transparent" 
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - (localTimer / (currentStep?.duration || 1)))}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-6xl font-mono font-black text-slate-800 tracking-tighter">
                {formatTime(localTimer)}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase mt-2">Restant</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-auto mb-10">
        {status === 'running' ? (
          <Button 
            variant="outline" 
            className="h-20 text-lg font-bold border-2 border-slate-100 hover:bg-slate-50 rounded-2xl" 
            onClick={() => updateSession({ status: 'paused' })}
          >
            <Pause className="mr-2 w-5 h-5" /> PAUSE
          </Button>
        ) : (
          <Button 
            className="h-20 text-lg font-bold bg-green-500 hover:bg-green-400 text-white rounded-2xl shadow-lg shadow-green-200" 
            onClick={() => updateSession({ status: 'running' })}
          >
            <Play className="mr-2 w-5 h-5" /> REPRENDRE
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          className="h-20 text-lg font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl" 
          onClick={() => updateSession({ status: 'setup', current_step_index: 0 })}
        >
          <Square className="mr-2 w-5 h-5 fill-current" /> ARRÊTER
        </Button>
      </div>
    </div>
  );
}