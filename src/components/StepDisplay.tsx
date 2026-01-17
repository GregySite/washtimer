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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-muted-foreground text-lg">
        <span>Étape {step.id} / 4</span>
      </div>

      {/* Main progress ring with icon */}
      <div className="relative">
        <ProgressRing 
          progress={stepProgress} 
          size={220} 
          strokeWidth={14}
          color={step.color}
        />
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color: step.color }}
        >
          <Icon className="w-16 h-16 md:w-20 md:h-20 mb-2" />
          <span className="text-4xl md:text-5xl font-bold text-foreground">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Step name and instruction */}
      <div className="text-center">
        <h2 
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: step.color }}
        >
          {step.name}
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground">
          {step.instruction}
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progression totale</span>
          <span>{Math.round(totalProgress)}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepDisplay;
