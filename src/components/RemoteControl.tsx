import { Play, Pause, Square, RotateCcw, LogOut, Settings } from "lucide-react";

interface RemoteControlProps {
  state: 'idle' | 'running' | 'paused' | 'completed';
  currentStepIndex: number;
  timeRemaining: number;
  totalDuration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
}

const STEPS = [
  { name: "Rinçage", icon: "💧", color: "bg-blue-400" },
  { name: "Shampooing", icon: "🧴", color: "bg-purple-400" },
  { name: "Savonnage", icon: "🧼", color: "bg-green-400" },
  { name: "Rinçage final", icon: "🚿", color: "bg-cyan-400" },
];

const RemoteControl = ({
  state,
  currentStepIndex,
  timeRemaining,
  totalDuration,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onLeave,
  onOpenSettings,
}: RemoteControlProps) => {
  var formatTime = function(seconds: number) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    var secsStr = secs < 10 ? '0' + secs : String(secs);
    return mins + ':' + secsStr;
  };

  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/20 to-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onLeave}
          className="p-3 bg-card rounded-full shadow-lg"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Télécommande</h1>
        <button
          onClick={onOpenSettings}
          className="p-3 bg-card rounded-full shadow-lg"
          disabled={state !== 'idle'}
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Current state display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {state === 'idle' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🚿</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Prêt à démarrer</h2>
            <p className="text-muted-foreground">
              Durée : {Math.floor(totalDuration / 60)} minutes
            </p>
          </div>
        )}

        {(state === 'running' || state === 'paused') && (
          <div className="w-full max-w-sm">
            {/* Current step */}
            <div className={`${currentStep.color} rounded-3xl p-6 text-white text-center mb-6`}>
              <div className="text-5xl mb-2">{currentStep.icon}</div>
              <h2 className="text-2xl font-bold">{currentStep.name}</h2>
              <div className="text-5xl font-mono font-bold mt-2">
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-card rounded-2xl p-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progression totale</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Step indicators */}
              <div className="flex justify-between mt-4">
                {STEPS.map((step, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center ${
                      index === currentStepIndex ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-xs text-muted-foreground mt-1">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === 'completed' && (
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Bravo !</h2>
            <p className="text-muted-foreground text-lg">
              Douche terminée avec succès !
            </p>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="space-y-4">
        {state === 'idle' && (
          <button
            onClick={onStart}
            className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity"
          >
            <Play className="w-8 h-8" />
            Démarrer la douche
          </button>
        )}

        {state === 'running' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onPause}
              className="py-6 bg-secondary text-secondary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Pause className="w-6 h-6" />
              Pause
            </button>
            <button
              onClick={onStop}
              className="py-6 bg-destructive text-destructive-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Square className="w-6 h-6" />
              Arrêter
            </button>
          </div>
        )}

        {state === 'paused' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onResume}
              className="py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-6 h-6" />
              Reprendre
            </button>
            <button
              onClick={onStop}
              className="py-6 bg-destructive text-destructive-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Square className="w-6 h-6" />
              Arrêter
            </button>
          </div>
        )}

        {state === 'completed' && (
          <button
            onClick={onReset}
            className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg"
          >
            <RotateCcw className="w-6 h-6" />
            Nouvelle douche
          </button>
        )}
      </div>
    </div>
  );
};

export default RemoteControl;
