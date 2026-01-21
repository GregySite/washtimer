import { cn } from "@/lib/utils";

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  label?: string;
  icon?: React.ReactNode;
  showLabel?: boolean;
  className?: string;
}

const SIZES = {
  sm: { size: 80, stroke: 6, fontSize: "text-lg", iconSize: 16 },
  md: { size: 120, stroke: 8, fontSize: "text-2xl", iconSize: 24 },
  lg: { size: 180, stroke: 12, fontSize: "text-4xl", iconSize: 36 },
  xl: { size: 280, stroke: 16, fontSize: "text-6xl", iconSize: 48 },
};

const CircularTimer = ({
  timeRemaining,
  totalTime,
  size = "lg",
  color = "hsl(195, 80%, 50%)",
  label,
  icon,
  showLabel = true,
  className,
}: CircularTimerProps) => {
  const config = SIZES[size];
  const radius = (config.size - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const offset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          className="transform -rotate-90"
          width={config.size}
          height={config.size}
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(210, 40%, 92%)"
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <div className="mb-1" style={{ color }}>
              {icon}
            </div>
          )}
          <span className={cn("font-bold font-mono", config.fontSize)} style={{ color }}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
      
      {showLabel && label && (
        <span className="mt-2 text-sm font-semibold text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
};

export default CircularTimer;
