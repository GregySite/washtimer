import { useState } from "react";
import { useShowerSync } from "@/hooks/useShowerSync";
import { DEFAULT_STEPS, Step } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Settings, Droplets, Sparkles, User, Smile } from "lucide-react";
import CircularTimer from "./CircularTimer";

const STEP_ICONS: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  User: <User className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
};

const STEP_COLORS: Record<string, string> = {
  Droplets: "hsl(195, 85%, 55%)",
  Sparkles: "hsl(280, 60%, 65%)",
  User: "hsl(340, 60%, 70%)",
  Smile: "hsl(140, 70%, 50%)",
};

export default function ParentView() {
  const { 
    sessionCode, 
    status, 
    steps, 
    currentStepIndex, 
    timeRemaining,
    totalDuration,
    updateSession, 
    joinSession,
    startShower,
    setSteps,
  } = useShowerSync("parent");
  
  const [sessionInput, setSessionInput] = useState("");
  const [localSteps, setLocalSteps] = useState<Step[]>(DEFAULT_STEPS);

  const activeSteps = steps.filter((s) => s.active);
  const currentStep = activeSteps[currentStepIndex];
  const stepColor = STEP_COLORS[currentStep?.icon || "Droplets"];

  // Calculate elapsed and progress
  const calculateElapsed = () => {
    let elapsed = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      elapsed += activeSteps[i].duration;
    }
    elapsed += (currentStep?.duration || 0) - timeRemaining;
    return elapsed;
  };
  const elapsed = calculateElapsed();
  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  const formatTime = (s: number) => {
    if (s < 0) s = 0;
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const handleJoin = async () => {
    const code = sessionInput.trim().toUpperCase();
    if (code.length < 4) return;
    const success = await joinSession(code);
    if (success) {
      // Mark as waiting so parent can configure
      await updateSession({ state: "waiting", steps: DEFAULT_STEPS });
    } else {
      alert("Code introuvable !");
    }
  };

  const handleLaunch = async () => {
    await updateSession({ steps: localSteps });
    setTimeout(() => startShower(), 100);
  };

  // --- SCREEN 1: LOGIN ---
  if (status === "setup" || !sessionCode) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-primary/10 to-background pt-20 px-6 gap-6">
        <h1 className="text-3xl font-black text-primary">DOUCHE PARENT 🛁</h1>
        <Card className="w-full max-w-sm p-8 shadow-xl border-none bg-card rounded-3xl">
          <label className="text-xs font-bold text-muted-foreground mb-2 block tracking-widest">
            CODE ENFANT
          </label>
          <Input
            className="text-center text-5xl h-24 font-mono uppercase font-black mb-6 border-2 border-primary/20 rounded-2xl"
            placeholder="ABCD"
            maxLength={4}
            value={sessionInput}
            onChange={(e) => setSessionInput(e.target.value.toUpperCase())}
          />
          <Button
            size="lg"
            className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-xl"
            onClick={handleJoin}
          >
            CONNECTER
          </Button>
        </Card>
      </div>
    );
  }

  // --- SCREEN 2: CONFIGURATION ---
  if (status === "waiting") {
    const localTotal = localSteps.filter(s => s.active).reduce((sum, s) => sum + s.duration, 0);
    
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-background pt-8 px-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Configuration
          </h2>
          <div className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">
            {Math.floor(localTotal / 60)} min {localTotal % 60 > 0 ? `${localTotal % 60}s` : ""}
          </div>
        </div>

        <div className="space-y-4">
          {localSteps.map((step, idx) => {
            const color = STEP_COLORS[step.icon] || "hsl(195, 85%, 55%)";
            const minutes = Math.floor(step.duration / 60);
            const seconds = step.duration % 60;

            return (
              <Card key={step.id} className="p-4 shadow-lg border-none bg-card rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: color }}
                  >
                    {STEP_ICONS[step.icon] || <Droplets className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-foreground text-lg">{step.label}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-xl flex-1">
                    <Input
                      type="number"
                      className="text-center font-mono font-bold text-xl h-10 bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                      value={minutes}
                      min={0}
                      max={10}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 0;
                        const newSteps = [...localSteps];
                        newSteps[idx] = { ...step, duration: m * 60 + seconds };
                        setLocalSteps(newSteps);
                      }}
                    />
                    <span className="text-xs font-bold text-muted-foreground">MIN</span>
                  </div>
                  <span className="font-black text-muted-foreground">:</span>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-xl flex-1">
                    <Input
                      type="number"
                      className="text-center font-mono font-bold text-xl h-10 bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                      value={seconds}
                      min={0}
                      max={59}
                      onChange={(e) => {
                        const s = parseInt(e.target.value) || 0;
                        const newSteps = [...localSteps];
                        newSteps[idx] = { ...step, duration: minutes * 60 + s };
                        setLocalSteps(newSteps);
                      }}
                    />
                    <span className="text-xs font-bold text-muted-foreground">SEC</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur border-t z-50">
          <Button
            className="w-full h-20 text-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl rounded-2xl"
            onClick={handleLaunch}
          >
            LANCER LA DOUCHE 🚀
          </Button>
        </div>
      </div>
    );
  }

  // --- SCREEN 3: MONITORING ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-background pt-10 px-6 pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full">
          Étape {currentStepIndex + 1} / {activeSteps.length}
        </span>
        <h1 className="text-3xl font-black text-foreground mt-4">
          {status === "finished" ? "Terminé ! 🎉" : currentStep?.label}
        </h1>
      </div>

      {/* Main timer */}
      {status !== "finished" && (
        <div className="flex justify-center mb-6">
          <CircularTimer
            timeRemaining={timeRemaining}
            totalTime={currentStep?.duration || 0}
            size="xl"
            color={stepColor}
            icon={STEP_ICONS[currentStep?.icon || "Droplets"]}
          />
        </div>
      )}

      {/* Progress */}
      {status !== "finished" && (
        <Card className="p-4 rounded-2xl border-none shadow-lg mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progression totale</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: stepColor }}
            />
          </div>
          
          {/* Mini step timers */}
          <div className="flex justify-between mt-4 gap-2">
            {activeSteps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isDone = idx < currentStepIndex;
              const color = STEP_COLORS[step.icon];
              
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center">
                  <CircularTimer
                    timeRemaining={
                      isDone ? 0 : 
                      isActive ? timeRemaining : 
                      step.duration
                    }
                    totalTime={step.duration}
                    size="sm"
                    color={isActive ? color : isDone ? "hsl(140, 70%, 50%)" : "hsl(210, 20%, 80%)"}
                    showLabel={false}
                  />
                  <span className="text-xs text-muted-foreground mt-1 truncate max-w-[60px] text-center">
                    {step.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="mt-auto grid grid-cols-2 gap-4">
        {status === "running" ? (
          <>
            <Button
              variant="outline"
              className="h-20 text-lg font-bold border-2 rounded-2xl"
              onClick={() => updateSession({ state: "paused" })}
            >
              <Pause className="mr-2 w-6 h-6" /> PAUSE
            </Button>
            <Button
              variant="ghost"
              className="h-20 text-lg font-bold text-destructive hover:bg-destructive/10 rounded-2xl"
              onClick={() => updateSession({ state: "setup", current_step_index: 0, time_remaining: 0 })}
            >
              <Square className="mr-2 w-6 h-6 fill-current" /> ARRÊTER
            </Button>
          </>
        ) : status === "paused" ? (
          <>
            <Button
              className="h-20 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-lg"
              onClick={() => updateSession({ state: "running" })}
            >
              <Play className="mr-2 w-6 h-6" /> REPRENDRE
            </Button>
            <Button
              variant="ghost"
              className="h-20 text-lg font-bold text-destructive hover:bg-destructive/10 rounded-2xl"
              onClick={() => updateSession({ state: "setup", current_step_index: 0, time_remaining: 0 })}
            >
              <Square className="mr-2 w-6 h-6 fill-current" /> ARRÊTER
            </Button>
          </>
        ) : status === "finished" ? (
          <Button
            className="col-span-2 h-20 text-xl font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl"
            onClick={() => updateSession({ state: "waiting" })}
          >
            🔄 Nouvelle douche
          </Button>
        ) : null}
      </div>
    </div>
  );
}
