import { useState } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS, Step } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Timer, Play, RotateCcw } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState<Step[]>(DEFAULT_STEPS);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (status === 'setup') {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-sm text-center shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Rejoindre l'enfant</h2>
          <Input value={sessionInput} onChange={(e) => setSessionInput(e.target.value.toUpperCase())} className="text-center text-3xl font-mono h-16 mb-6" placeholder="CODE" maxLength={4} />
          <Button className="w-full h-14 bg-pink-600" onClick={() => joinSession(sessionInput)}>Se connecter</Button>
        </Card>
      </div>
    );
  }

  if (status === 'waiting' || status === 'ready') {
    return (
      <div className="min-h-screen bg-pink-50 p-6 pb-32">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Timer /> Config Douche</h1>
        <div className="space-y-4">
          {localSteps.map((step) => (
            <Card key={step.id} className="p-4 bg-white/80">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">{step.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatTime(step.duration)}</span>
                  <Switch checked={step.active} onCheckedChange={() => setLocalSteps(localSteps.map(s => s.id === step.id ? {...s, active: !s.active} : s))} />
                </div>
              </div>
              {step.active && <Slider value={[step.duration]} max={600} step={15} onValueChange={([v]) => setLocalSteps(localSteps.map(s => s.id === step.id ? {...s, duration: v} : s))} />}
            </Card>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t flex gap-4">
          <Button className="flex-1 h-16 text-xl font-bold bg-green-600" onClick={() => updateSession({ status: 'running', steps: localSteps, current_step_index: 0 })}>
            <Play className="mr-2" /> LANCER
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl mb-4">Douche en cours...</h2>
      <div className="text-4xl font-black text-pink-600 mb-8">{steps[currentStepIndex]?.label}</div>
      <Button variant="outline" onClick={() => updateSession({ status: 'waiting' })}><RotateCcw className="mr-2"/> Réinitialiser</Button>
    </div>
  );
}