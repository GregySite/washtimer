import { useState } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS, Step } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Timer, Play, RotateCcw, Loader2 } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [isLoading, setIsLoading] = useState(false);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // FONCTION DE CONNEXION CORRIGÉE
  const handleConnect = async () => {
    setIsLoading(true);
    const codeToJoin = sessionInput.trim().toUpperCase();
    console.log("Tentative de connexion au code :", codeToJoin);
    
    const success = await joinSession(codeToJoin);
    
    if (success) {
      console.log("Trouvé ! Passage au statut 'waiting'...");
      // C'est cette ligne qui débloque l'écran de l'enfant
      await updateSession({ 
        status: 'waiting', 
        steps: DEFAULT_STEPS,
        current_step_index: 0 
      });
    } else {
      alert("Code non trouvé dans la base de données. Vérifie l'écran enfant.");
    }
    setIsLoading(false);
  };

  // ÉCRAN 1 : SAISIE DU CODE
  if (status === 'setup' || !sessionCode) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-sm text-center shadow-xl border-t-4 border-pink-500">
          <h2 className="text-2xl font-bold text-pink-900 mb-4">Rejoindre la douche</h2>
          <p className="text-pink-700 text-sm mb-6">Entre le code affiché sur l'autre appareil</p>
          <Input 
            value={sessionInput} 
            onChange={(e) => setSessionInput(e.target.value.toUpperCase())} 
            className="text-center text-3xl font-mono h-16 mb-6 border-2 border-pink-200" 
            placeholder="CODE" 
            maxLength={4} 
          />
          <Button 
            className="w-full h-14 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl" 
            onClick={handleConnect}
            disabled={isLoading || sessionInput.length < 4}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "SE CONNECTER"}
          </Button>
        </Card>
      </div>
    );
  }

  // ÉCRAN 2 : CONFIGURATION DES ÉTAPES
  if (status === 'waiting' || status === 'ready') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-pink-900 flex items-center gap-2"><Timer /> Réglages</h1>
          <span className="bg-pink-200 text-pink-700 px-3 py-1 rounded-full text-xs font-mono font-bold">SESSION: {sessionCode}</span>
        </div>
        
        <div className="space-y-4">
          {localSteps.map((step) => (
            <Card key={step.id} className="p-4 bg-white/90 shadow-sm border-none">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-800">{step.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{formatTime(step.duration)}</span>
                  <Switch 
                    checked={step.active} 
                    onCheckedChange={() => setLocalSteps(localSteps.map(s => s.id === step.id ? {...s, active: !s.active} : s))} 
                  />
                </div>
              </div>
              {step.active && (
                <Slider 
                  value={[step.duration]} 
                  max={600} 
                  step={15} 
                  onValueChange={([v]) => setLocalSteps(localSteps.map(s => s.id === step.id ? {...s, duration: v} : s))} 
                />
              )}
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t flex gap-4">
          <Button 
            className="flex-1 h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg" 
            onClick={() => updateSession({ status: 'running', steps: localSteps, current_step_index: 0 })}
          >
            <Play className="mr-2" /> LANCER LA DOUCHE
          </Button>
        </div>
      </div>
    );
  }

  // ÉCRAN 3 : PENDANT LA DOUCHE
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-pink-400 uppercase tracking-widest text-sm font-bold mb-2">Douche en cours</p>
      <div className="text-4xl font-black text-pink-600 mb-12 uppercase">{steps[currentStepIndex]?.label || "Action..."}</div>
      <Button 
        variant="outline" 
        className="h-14 px-8 border-2 border-pink-200 text-pink-600 font-bold rounded-xl"
        onClick={() => updateSession({ status: 'waiting' })}
      >
        <RotateCcw className="mr-2 w-5 h-5"/> RÉINITIALISER
      </Button>
    </div>
  );
}