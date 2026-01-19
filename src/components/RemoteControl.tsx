import { useState } from "react";
import { Play, Pause, Square, RotateCcw, LogOut, Settings } from "lucide-react";
import StepEditor, { StepConfig } from "./StepEditor";

interface RemoteControlProps {
  state: 'idle' | 'running' | 'paused' | 'completed';
  currentStepIndex: number;
  timeRemaining: number;
  totalDuration: number;
  steps: StepConfig[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onLeave: () => void;
  onStepsChange: (steps: StepConfig[]) => void;
  onTotalDurationChange: (duration: number) => void;
}

var RemoteControl = function({
  state,
  currentStepIndex,
  timeRemaining,
  totalDuration,
  steps,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onLeave,
  onStepsChange,
  onTotalDurationChange,
}: RemoteControlProps) {
  var settingsOpenResult = useState(false);
  var settingsOpen = settingsOpenResult[0];
  var setSettingsOpen = settingsOpenResult[1];

  var formatTime = function(seconds: number) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    var secsStr = secs < 10 ? '0' + secs : String(secs);
    return mins + ':' + secsStr;
  };

  // Calculate elapsed time
  var calculateElapsed = function() {
    var elapsed = 0;
    for (var i = 0; i < currentStepIndex; i++) {
      elapsed += steps[i].duration;
    }
    var currentStepDuration = steps[currentStepIndex] ? steps[currentStepIndex].duration : 0;
    elapsed += currentStepDuration - timeRemaining;
    return elapsed;
  };

  var elapsed = calculateElapsed();
  var progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  var currentStep = steps[currentStepIndex] || steps[0];

  var EMOJIS: Record<string, string> = {
    rinse: "💧",
    shampoo: "🧴",
    soap: "🧼",
    final: "🚿",
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-gradient-to-b from-primary/20 to-background p-6"
      style={{ 
        minHeight: '100vh', 
        display: 'flex',
        WebkitFlexDirection: 'column',
        flexDirection: 'column',
        padding: '1.5rem',
        background: 'linear-gradient(to bottom, hsla(195, 80%, 50%, 0.2), hsl(210, 40%, 98%))'
      }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center mb-6"
        style={{ display: 'flex', WebkitJustifyContent: 'space-between', justifyContent: 'space-between', WebkitAlignItems: 'center', alignItems: 'center', marginBottom: '1.5rem' }}
      >
        <button
          onClick={onLeave}
          className="p-3 bg-card rounded-full shadow-lg"
          style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
        >
          <LogOut className="w-5 h-5 text-muted-foreground" style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
        <h1 className="text-xl font-bold text-foreground" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Télécommande
        </h1>
        <button
          onClick={function() { setSettingsOpen(true); }}
          className="p-3 bg-card rounded-full shadow-lg"
          disabled={state !== 'idle'}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            border: 'none', 
            cursor: state === 'idle' ? 'pointer' : 'not-allowed',
            opacity: state === 'idle' ? 1 : 0.5
          }}
        >
          <Settings className="w-5 h-5 text-muted-foreground" style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
      </div>

      {/* Current state display */}
      <div 
        className="flex-1 flex flex-col items-center justify-center gap-6"
        style={{ 
          WebkitFlex: 1, 
          flex: 1, 
          display: 'flex',
          WebkitFlexDirection: 'column',
          flexDirection: 'column',
          WebkitAlignItems: 'center',
          alignItems: 'center',
          WebkitJustifyContent: 'center',
          justifyContent: 'center'
        }}
      >
        {state === 'idle' && (
          <div className="text-center w-full max-w-sm" style={{ textAlign: 'center', width: '100%', maxWidth: '24rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚿</div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Prêt à démarrer
            </h2>
            <p className="text-muted-foreground mb-6" style={{ marginBottom: '1.5rem' }}>
              Durée : {Math.floor(totalDuration / 60)} min {totalDuration % 60 > 0 ? (totalDuration % 60) + ' s' : ''}
            </p>
            
            {/* Steps preview */}
            <div 
              className="bg-card rounded-2xl p-4"
              style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1rem' }}
            >
              <div className="text-sm text-muted-foreground mb-3" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Étapes configurées
              </div>
              <div className="space-y-2">
                {steps.map(function(step) {
                  return (
                    <div 
                      key={step.id}
                      className="flex items-center justify-between bg-muted/50 rounded-xl p-2"
                      style={{ 
                        display: 'flex', 
                        WebkitAlignItems: 'center', 
                        alignItems: 'center', 
                        WebkitJustifyContent: 'space-between', 
                        justifyContent: 'space-between',
                        backgroundColor: 'hsla(0, 0%, 90%, 0.5)',
                        borderRadius: '0.75rem',
                        padding: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div className="flex items-center gap-2" style={{ display: 'flex', WebkitAlignItems: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem' }}>{EMOJIS[step.icon] || "🚿"}</span>
                        <span className="text-sm font-medium" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{step.name}</span>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {formatTime(step.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(state === 'running' || state === 'paused') && (
          <div className="w-full max-w-sm" style={{ width: '100%', maxWidth: '24rem' }}>
            {/* Current step */}
            <div 
              className="rounded-3xl p-6 text-white text-center mb-6"
              style={{ 
                borderRadius: '1.5rem', 
                padding: '1.5rem', 
                color: 'white', 
                textAlign: 'center', 
                marginBottom: '1.5rem',
                backgroundColor: currentStep.color
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{EMOJIS[currentStep.icon] || "🚿"}</div>
              <h2 className="text-2xl font-bold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentStep.name}</h2>
              <div className="text-5xl font-mono font-bold mt-2" style={{ fontSize: '3rem', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '0.5rem' }}>
                {formatTime(timeRemaining)}
              </div>
              {state === 'paused' && (
                <div 
                  className="mt-2 bg-white/20 rounded-full px-4 py-1 inline-block"
                  style={{ marginTop: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.25rem 1rem', display: 'inline-block' }}
                >
                  ⏸️ En pause
                </div>
              )}
            </div>

            {/* Progress */}
            <div 
              className="bg-card rounded-2xl p-4"
              style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1rem' }}
            >
              <div 
                className="flex justify-between text-sm text-muted-foreground mb-2"
                style={{ display: 'flex', WebkitJustifyContent: 'space-between', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}
              >
                <span>Progression totale</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div 
                className="h-3 bg-muted rounded-full overflow-hidden"
                style={{ height: '0.75rem', backgroundColor: 'hsl(210, 40%, 96%)', borderRadius: '9999px', overflow: 'hidden' }}
              >
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ 
                    height: '100%', 
                    backgroundColor: 'hsl(195, 80%, 50%)', 
                    width: progress + '%',
                    WebkitTransition: 'width 0.3s',
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              
              {/* Step indicators */}
              <div 
                className="flex justify-between mt-4"
                style={{ display: 'flex', WebkitJustifyContent: 'space-between', justifyContent: 'space-between', marginTop: '1rem' }}
              >
                {steps.map(function(step, index) {
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center"
                      style={{ 
                        display: 'flex', 
                        WebkitFlexDirection: 'column', 
                        flexDirection: 'column', 
                        WebkitAlignItems: 'center', 
                        alignItems: 'center',
                        opacity: index === currentStepIndex ? 1 : 0.4
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{EMOJIS[step.icon] || "🚿"}</span>
                      <span className="text-xs text-muted-foreground mt-1" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {step.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {state === 'completed' && (
          <div className="text-center" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Bravo !
            </h2>
            <p className="text-muted-foreground text-lg" style={{ fontSize: '1.125rem' }}>
              Douche terminée avec succès !
            </p>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div style={{ marginTop: '1rem' }}>
        {state === 'idle' && (
          <button
            onClick={onStart}
            className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity"
            style={{ 
              width: '100%', 
              padding: '1.5rem 0', 
              backgroundColor: 'hsl(195, 80%, 50%)', 
              color: 'white', 
              borderRadius: '1.5rem', 
              fontWeight: 'bold', 
              fontSize: '1.5rem',
              display: 'flex',
              WebkitAlignItems: 'center',
              alignItems: 'center',
              WebkitJustifyContent: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Play className="w-8 h-8" style={{ width: '2rem', height: '2rem' }} />
            Démarrer la douche
          </button>
        )}

        {state === 'running' && (
          <div 
            className="grid grid-cols-2 gap-4"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
          >
            <button
              onClick={onPause}
              className="py-6 bg-secondary text-secondary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
              style={{ 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(340, 60%, 85%)', 
                color: 'hsl(340, 60%, 30%)', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                display: 'flex',
                WebkitAlignItems: 'center',
                alignItems: 'center',
                WebkitJustifyContent: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Pause className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
              Pause
            </button>
            <button
              onClick={onStop}
              className="py-6 bg-destructive text-destructive-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
              style={{ 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(0, 85%, 60%)', 
                color: 'white', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                display: 'flex',
                WebkitAlignItems: 'center',
                alignItems: 'center',
                WebkitJustifyContent: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Square className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
              Arrêter
            </button>
          </div>
        )}

        {state === 'paused' && (
          <div 
            className="grid grid-cols-2 gap-4"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
          >
            <button
              onClick={onResume}
              className="py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
              style={{ 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(195, 80%, 50%)', 
                color: 'white', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                display: 'flex',
                WebkitAlignItems: 'center',
                alignItems: 'center',
                WebkitJustifyContent: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Play className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
              Reprendre
            </button>
            <button
              onClick={onStop}
              className="py-6 bg-destructive text-destructive-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-2 shadow-lg"
              style={{ 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(0, 85%, 60%)', 
                color: 'white', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                display: 'flex',
                WebkitAlignItems: 'center',
                alignItems: 'center',
                WebkitJustifyContent: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Square className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
              Arrêter
            </button>
          </div>
        )}

        {state === 'completed' && (
          <button
            onClick={onReset}
            className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg"
            style={{ 
              width: '100%', 
              padding: '1.5rem 0', 
              backgroundColor: 'hsl(195, 80%, 50%)', 
              color: 'white', 
              borderRadius: '1.5rem', 
              fontWeight: 'bold', 
              fontSize: '1.25rem',
              display: 'flex',
              WebkitAlignItems: 'center',
              alignItems: 'center',
              WebkitJustifyContent: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RotateCcw className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
            Nouvelle douche
          </button>
        )}
      </div>

      {/* Step Editor Modal */}
      <StepEditor
        isOpen={settingsOpen}
        onClose={function() { setSettingsOpen(false); }}
        steps={steps}
        onStepsChange={onStepsChange}
        totalDuration={totalDuration}
        onTotalDurationChange={onTotalDurationChange}
      />
    </div>
  );
};

export default RemoteControl;
