import { useShowerSync } from "@/hooks/useShowerSync";
import { Loader2, Droplets, Sparkles, User, Smile, Pause } from "lucide-react";
import CircularTimer from "./CircularTimer";

const STEP_ICONS: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-12 h-12" />,
  Sparkles: <Sparkles className="w-12 h-12" />,
  User: <User className="w-12 h-12" />,
  Smile: <Smile className="w-12 h-12" />,
};

const STEP_COLORS: Record<string, string> = {
  Droplets: "hsl(195, 85%, 55%)",
  Sparkles: "hsl(280, 60%, 65%)",
  User: "hsl(340, 60%, 70%)",
  Smile: "hsl(140, 70%, 50%)",
};

export default function ChildView() {
  const { 
    sessionCode, 
    status, 
    steps, 
    currentStepIndex, 
    timeRemaining, 
    totalDuration 
  } = useShowerSync("child");

  const activeSteps = steps.filter((s) => s.active);
  const currentStep = activeSteps[currentStepIndex];

  // Calculate total elapsed time
  const calculateElapsed = () => {
    let elapsed = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      elapsed += activeSteps[i].duration;
    }
    elapsed += (currentStep?.duration || 0) - timeRemaining;
    return elapsed;
  };

  const elapsed = calculateElapsed();
  const totalProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  // WAITING SCREEN
  if (status === "setup" || status === "waiting" || status === "ready") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex flex-col items-center justify-center p-6">
        <div className="bg-card/80 backdrop-blur-xl p-12 rounded-[3rem] border border-border shadow-2xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-muted-foreground mb-6 text-center uppercase tracking-widest">
            Code Magique
          </h2>
          <div className="text-7xl font-black font-mono text-center text-primary mb-8 tracking-tighter">
            {sessionCode || <Loader2 className="animate-spin mx-auto w-16 h-16" />}
          </div>
          <div className="flex items-center justify-center gap-3 animate-pulse bg-primary/10 py-3 px-6 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <p className="font-semibold text-sm text-primary">En attente de Papa/Maman...</p>
          </div>
        </div>

        {/* Steps preview */}
        <div className="mt-8 bg-card/60 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
            Programme de la douche
          </h3>
          <div className="flex justify-center gap-4">
            {activeSteps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: STEP_COLORS[step.icon] || "hsl(195, 85%, 55%)" }}
                >
                  {STEP_ICONS[step.icon] ? (
                    <div className="w-6 h-6">
                      {STEP_ICONS[step.icon]}
                    </div>
                  ) : (
                    <Droplets className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground mt-2 max-w-[60px] text-center truncate">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SHOWER IN PROGRESS
  if (status === "running" || status === "paused") {
    const stepColor = STEP_COLORS[currentStep?.icon || "Droplets"];
    const stepIcon = STEP_ICONS[currentStep?.icon || "Droplets"];

    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-700"
        style={{ 
          background: `linear-gradient(135deg, ${stepColor}20 0%, ${stepColor}05 50%, hsl(210, 40%, 98%) 100%)` 
        }}
      >
        {/* Decorative bubbles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: stepColor }} />
        <div className="absolute bottom-32 right-10 w-40 h-40 rounded-full blur-3xl opacity-20 animate-pulse delay-700" style={{ backgroundColor: stepColor }} />

        {/* Step indicator */}
        <div className="text-center mb-6 z-10">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Étape {currentStepIndex + 1} / {activeSteps.length}
          </span>
        </div>

        {/* Main circular timer */}
        <div className="z-10 mb-6">
          <CircularTimer
            timeRemaining={timeRemaining}
            totalTime={currentStep?.duration || 0}
            size="xl"
            color={stepColor}
            icon={stepIcon}
          />
        </div>

        {/* Step name */}
        <h2 
          className="text-4xl font-black text-center mb-2 z-10"
          style={{ color: stepColor }}
        >
          {currentStep?.label}
        </h2>

        {/* Pause indicator */}
        {status === "paused" && (
          <div className="mt-6 bg-amber-400 text-amber-900 px-8 py-3 rounded-full font-bold text-lg shadow-xl animate-bounce z-20 flex items-center gap-2">
            <Pause className="w-5 h-5" />
            PAUSE
          </div>
        )}

        {/* Overall progress */}
        <div className="mt-8 w-full max-w-md z-10">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progression totale</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${totalProgress}%`,
                backgroundColor: stepColor
              }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex gap-3 z-10">
          {activeSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;
            const color = STEP_COLORS[step.icon] || stepColor;
            
            return (
              <div
                key={step.id}
                className="relative"
              >
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
                {isDone && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // FINISHED SCREEN
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 to-teal-500 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-8xl mb-6 animate-bounce">🎉</div>
      <h2 className="text-5xl font-black mb-4 drop-shadow-lg">BRAVO !</h2>
      <p className="text-2xl font-bold opacity-90">Tu es tout propre ! ✨</p>
    </div>
  );
}
