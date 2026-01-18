import { Droplets, Sparkles, Bath, CheckCircle2 } from "lucide-react";
import ProgressRing from "./ProgressRing";

export interface ShowerStep {
  id: number;
  name: string;
  icon: "rinse" | "shampoo" | "soap" | "final";
  duration: number; // in seconds
  color: string;
  instruction: string;
}

interface StepDisplayProps {
  step: ShowerStep;
  timeRemaining: number;
  totalProgress: number;
}

const icons = {
  rinse: Droplets,
  shampoo: Sparkles,
  soap: Bath,
  final: CheckCircle2,
};

const StepDisplay = ({ step, timeRemaining, totalProgress }: StepDisplayProps) => {
  const Icon = icons[step.icon];
  const stepProgress = ((step.duration - timeRemaining) / step.duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const secsStr = secs < 10 ? '0' + secs : String(secs);
    return mins + ':' + secsStr;
  };

  return (
    <div 
      className="flex flex-col items-center gap-6 md:gap-8"
      style={{
        display: '-webkit-flex',
        WebkitFlexDirection: 'column',
        WebkitAlignItems: 'center',
      }}
    >
      {/* Step indicator */}
      <div 
        className="flex items-center gap-2 text-muted-foreground text-lg"
        style={{
          display: '-webkit-flex',
          WebkitAlignItems: 'center',
          color: '#4a7a8a',
        }}
      >
        <span>Étape {step.id} / 4</span>
      </div>

      {/* Main progress ring with icon */}
      <div style={{ position: 'relative' }}>
        <ProgressRing 
          progress={stepProgress} 
          size={220} 
          strokeWidth={14}
          color={step.color}
        />
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: '-webkit-flex',
            WebkitFlexDirection: 'column',
            WebkitAlignItems: 'center',
            WebkitJustifyContent: 'center',
            color: step.color,
          }}
        >
          <Icon className="w-16 h-16 md:w-20 md:h-20 mb-2" />
          <span 
            className="text-4xl md:text-5xl font-bold text-foreground"
            style={{ color: '#1a4a5c', fontWeight: 700 }}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Step name and instruction */}
      <div style={{ textAlign: 'center' }}>
        <h2 
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: step.color, fontWeight: 700, marginBottom: '0.5rem' }}
        >
          {step.name}
        </h2>
        <p 
          className="text-xl md:text-2xl text-muted-foreground"
          style={{ color: '#4a7a8a' }}
        >
          {step.instruction}
        </p>
      </div>

      {/* Overall progress bar */}
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div 
          className="flex justify-between text-sm text-muted-foreground mb-2"
          style={{
            display: '-webkit-flex',
            WebkitJustifyContent: 'space-between',
            color: '#4a7a8a',
            marginBottom: '0.5rem',
          }}
        >
          <span>Progression totale</span>
          <span>{Math.round(totalProgress)}%</span>
        </div>
        <div 
          className="h-4 bg-muted rounded-full overflow-hidden"
          style={{
            height: '1rem',
            backgroundColor: '#c5dfe8',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ 
              width: totalProgress + '%',
              height: '100%',
              backgroundColor: '#14b8d4',
              borderRadius: '9999px',
              WebkitTransition: 'width 0.5s ease',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepDisplay;
