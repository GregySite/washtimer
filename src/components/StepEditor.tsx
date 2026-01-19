import { useState, useEffect } from "react";
import { X, Clock, Droplets, SprayCan, Sparkles, ShowerHead } from "lucide-react";

export interface StepConfig {
  id: number;
  name: string;
  icon: string;
  duration: number;
  color: string;
  instruction: string;
}

interface StepEditorProps {
  isOpen: boolean;
  onClose: () => void;
  steps: StepConfig[];
  onStepsChange: (steps: StepConfig[]) => void;
  totalDuration: number;
  onTotalDurationChange: (duration: number) => void;
}

var ICONS: Record<string, React.ReactNode> = {
  rinse: <Droplets className="w-6 h-6" />,
  shampoo: <SprayCan className="w-6 h-6" />,
  soap: <Sparkles className="w-6 h-6" />,
  final: <ShowerHead className="w-6 h-6" />,
};

var EMOJIS: Record<string, string> = {
  rinse: "💧",
  shampoo: "🧴",
  soap: "🧼",
  final: "🚿",
};

var StepEditor = function({ isOpen, onClose, steps, onStepsChange, totalDuration, onTotalDurationChange }: StepEditorProps) {
  var tempStepsResult = useState(steps);
  var tempSteps = tempStepsResult[0];
  var setTempSteps = tempStepsResult[1];

  // Sync with props when modal opens
  useEffect(function() {
    if (isOpen) {
      setTempSteps(steps);
    }
  }, [isOpen, steps]);

  if (!isOpen) return null;

  var handleStepDurationChange = function(stepId: number, newDuration: number) {
    var updated = tempSteps.map(function(step) {
      if (step.id === stepId) {
        return { ...step, duration: newDuration };
      }
      return step;
    });
    setTempSteps(updated);
  };

  var calculateTotal = function() {
    var total = 0;
    for (var i = 0; i < tempSteps.length; i++) {
      total += tempSteps[i].duration;
    }
    return total;
  };

  var handleSave = function() {
    var newTotal = calculateTotal();
    onStepsChange(tempSteps);
    onTotalDurationChange(newTotal);
    onClose();
  };

  var formatDuration = function(seconds: number) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return mins + ' min ' + secs + ' s';
    } else if (mins > 0) {
      return mins + ' min';
    } else {
      return secs + ' s';
    }
  };

  var totalCalculated = calculateTotal();

  return (
    <div 
      className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex',
        WebkitAlignItems: 'center',
        alignItems: 'center',
        WebkitJustifyContent: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}
    >
      <div 
        className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'white', 
          borderRadius: '1.5rem', 
          padding: '1.5rem', 
          width: '100%', 
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-6"
          style={{ display: 'flex', WebkitAlignItems: 'center', alignItems: 'center', WebkitJustifyContent: 'space-between', justifyContent: 'space-between', marginBottom: '1.5rem' }}
        >
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            <Clock className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
            Réglages des étapes
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            style={{ padding: '0.5rem', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        {/* Total duration */}
        <div 
          className="bg-primary/10 rounded-2xl p-4 mb-6"
          style={{ backgroundColor: 'hsla(195, 80%, 50%, 0.1)', borderRadius: '1rem', padding: '1rem', marginBottom: '1.5rem' }}
        >
          <div className="text-center" style={{ textAlign: 'center' }}>
            <div className="text-sm text-muted-foreground mb-1" style={{ fontSize: '0.875rem' }}>
              Durée totale
            </div>
            <div className="text-3xl font-bold text-primary" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'hsl(195, 80%, 50%)' }}>
              {formatDuration(totalCalculated)}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4" style={{ marginBottom: '1rem' }}>
          {tempSteps.map(function(step) {
            return (
              <div 
                key={step.id}
                className="bg-muted/50 rounded-2xl p-4"
                style={{ backgroundColor: 'hsla(0, 0%, 90%, 0.5)', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}
              >
                <div 
                  className="flex items-center gap-3 mb-3"
                  style={{ display: 'flex', WebkitAlignItems: 'center', alignItems: 'center', marginBottom: '0.75rem' }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{EMOJIS[step.icon] || "🚿"}</span>
                  <span className="font-semibold text-card-foreground" style={{ fontWeight: 600 }}>
                    {step.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-4" style={{ display: 'flex', WebkitAlignItems: 'center', alignItems: 'center' }}>
                  <input
                    type="range"
                    min={15}
                    max={300}
                    step={15}
                    value={step.duration}
                    onChange={function(e) {
                      handleStepDurationChange(step.id, Number(e.target.value));
                    }}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      WebkitFlex: 1,
                      flex: 1,
                      height: '0.5rem',
                      borderRadius: '9999px',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      background: 'linear-gradient(to right, ' + step.color + ' ' + ((step.duration - 15) / (300 - 15) * 100) + '%, hsl(0, 0%, 85%) ' + ((step.duration - 15) / (300 - 15) * 100) + '%)'
                    }}
                  />
                  <span 
                    className="text-sm font-mono font-semibold w-20 text-right"
                    style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, width: '5rem', textAlign: 'right' }}
                  >
                    {formatDuration(step.duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity"
          style={{ 
            width: '100%', 
            padding: '1rem 0', 
            backgroundColor: 'hsl(195, 80%, 50%)', 
            color: 'white', 
            borderRadius: '1rem', 
            fontWeight: 'bold', 
            fontSize: '1.25rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
};

export default StepEditor;
