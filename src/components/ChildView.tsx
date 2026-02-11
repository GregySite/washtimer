import { useShowerSync } from "@/hooks/useShowerSync";
import { Loader2, Droplets, Sparkles, User, Smile, Pause } from "lucide-react";
import { useEffect, useState } from "react";

/* ── Animated icon component ── */
const AnimatedStepIcon = ({ icon, color }: { icon: string; color: string }) => {
  const iconSize = "w-20 h-20 sm:w-24 sm:h-24";

  const iconMap: Record<string, React.ReactNode> = {
    Droplets: <Droplets className={iconSize} />,
    Sparkles: <Sparkles className={iconSize} />,
    User: <User className={iconSize} />,
    Smile: <Smile className={iconSize} />,
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ color }}
    >
      {/* Pulsing glow ring */}
      <div
        className="absolute rounded-full animate-ping"
        style={{
          width: 180,
          height: 180,
          backgroundColor: `${color}15`,
          animationDuration: "2s",
        }}
      />
      {/* Outer breathing ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          border: `4px solid ${color}30`,
          animation: "breathe 3s ease-in-out infinite",
        }}
      />
      {/* Icon container */}
      <div
        className="relative z-10"
        style={{ animation: "icon-bounce 2s ease-in-out infinite" }}
      >
        {iconMap[icon] || <Droplets className={iconSize} />}
      </div>
    </div>
  );
};

/* ── Aquatic bubbles for child view ── */
const AquaBubbles = ({ color }: { color: string }) => {
  const [bubbles] = useState(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,
        size: 12 + Math.random() * 35,
        duration: 6 + Math.random() * 10,
        delay: Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.3,
      });
    }
    return arr;
  });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            backgroundColor: `${color}`,
            opacity: b.opacity,
            animation: `float-up ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ── Step dot indicator ── */
const StepDots = ({
  steps,
  currentIndex,
  colors,
}: {
  steps: { id: string; icon: string }[];
  currentIndex: number;
  colors: Record<string, string>;
}) => {
  const dotIcons: Record<string, React.ReactNode> = {
    Droplets: <Droplets className="w-4 h-4" />,
    Sparkles: <Sparkles className="w-4 h-4" />,
    User: <User className="w-4 h-4" />,
    Smile: <Smile className="w-4 h-4" />,
  };

  return (
    <div className="flex gap-3 items-center">
      {steps.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;
        const c = colors[step.icon] || "hsl(195, 85%, 55%)";

        return (
          <div key={step.id} className="flex flex-col items-center gap-1">
            <div
              className="rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                width: isActive ? 48 : 36,
                height: isActive ? 48 : 36,
                backgroundColor: isDone ? "hsl(140, 70%, 50%)" : isActive ? c : "hsl(210, 30%, 88%)",
                color: isDone || isActive ? "white" : "hsl(210, 20%, 60%)",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                boxShadow: isActive ? `0 0 20px ${c}60` : "none",
              }}
            >
              {isDone ? (
                <span className="text-sm font-bold">✓</span>
              ) : (
                dotIcons[step.icon] || <Droplets className="w-4 h-4" />
              )}
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className="absolute"
                style={{
                  width: 2,
                  height: 8,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Circular countdown ── */
const BigCountdown = ({
  timeRemaining,
  totalTime,
  color,
}: {
  timeRemaining: number;
  totalTime: number;
  color: string;
}) => {
  const size = 220;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const offset = circumference * (1 - progress);

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(210, 40%, 92%)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-black font-mono text-5xl sm:text-6xl"
          style={{ color }}
        >
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

/* ── Step colors ── */
const STEP_COLORS: Record<string, string> = {
  Droplets: "hsl(195, 85%, 55%)",
  Sparkles: "hsl(280, 60%, 65%)",
  User: "hsl(340, 60%, 70%)",
  Smile: "hsl(140, 70%, 50%)",
};

const STEP_BG: Record<string, string> = {
  Droplets: "linear-gradient(170deg, hsl(195, 90%, 92%) 0%, hsl(200, 80%, 96%) 50%, hsl(210, 40%, 98%) 100%)",
  Sparkles: "linear-gradient(170deg, hsl(280, 70%, 93%) 0%, hsl(270, 50%, 96%) 50%, hsl(210, 40%, 98%) 100%)",
  User: "linear-gradient(170deg, hsl(340, 70%, 94%) 0%, hsl(350, 50%, 96%) 50%, hsl(210, 40%, 98%) 100%)",
  Smile: "linear-gradient(170deg, hsl(140, 70%, 92%) 0%, hsl(150, 50%, 96%) 50%, hsl(210, 40%, 98%) 100%)",
};

/* ── Main component ── */
export default function ChildView() {
  const {
    sessionCode,
    status,
    steps,
    currentStepIndex,
    timeRemaining,
    totalDuration,
  } = useShowerSync("child");

  const activeSteps = steps.filter((s) => s.active);
  const currentStep = activeSteps[currentStepIndex];

  // Total progress
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

  // ═══ WAITING SCREEN ═══
  if (status === "setup" || status === "waiting" || status === "ready") {
    return (
      <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col items-center justify-center p-4"
        style={{ background: STEP_BG["Droplets"] }}
      >
        <AquaBubbles color="hsl(195, 85%, 75%)" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Cute water icon */}
          <div className="mb-6" style={{ animation: "icon-bounce 2.5s ease-in-out infinite" }}>
            <Droplets className="w-16 h-16 text-primary" />
          </div>

          {/* Session code */}
          <div className="bg-card/90 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-border shadow-2xl max-w-xs w-full text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Code Magique
            </p>
            <div className="text-5xl sm:text-6xl font-black font-mono text-primary mb-4 tracking-tight">
              {sessionCode || <Loader2 className="animate-spin mx-auto w-10 h-10" />}
            </div>
            <div className="flex items-center justify-center gap-2 animate-pulse bg-primary/10 py-2.5 px-4 rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <p className="font-semibold text-xs text-primary">En attente de Papa/Maman...</p>
            </div>
          </div>

          {/* Steps preview */}
          <div className="mt-5 flex gap-3">
            {activeSteps.map((step) => (
              <div
                key={step.id}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{
                  backgroundColor: STEP_COLORS[step.icon] || "hsl(195, 85%, 55%)",
                  animation: "icon-bounce 3s ease-in-out infinite",
                  animationDelay: `${activeSteps.indexOf(step) * 0.3}s`,
                }}
              >
                {step.icon === "Droplets" && <Droplets className="w-6 h-6" />}
                {step.icon === "Sparkles" && <Sparkles className="w-6 h-6" />}
                {step.icon === "User" && <User className="w-6 h-6" />}
                {step.icon === "Smile" && <Smile className="w-6 h-6" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══ SHOWER IN PROGRESS ═══
  if (status === "running" || status === "paused") {
    const stepColor = STEP_COLORS[currentStep?.icon || "Droplets"];
    const stepBg = STEP_BG[currentStep?.icon || "Droplets"];

    return (
      <div
        className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col items-center justify-between py-6 px-4 relative"
        style={{ background: stepBg, transition: "background 0.8s ease" }}
      >
        <AquaBubbles color={stepColor} />

        {/* Top: step dots */}
        <div className="z-10">
          <StepDots
            steps={activeSteps.map((s) => ({ id: s.id, icon: s.icon }))}
            currentIndex={currentStepIndex}
            colors={STEP_COLORS}
          />
        </div>

        {/* Center: icon + timer */}
        <div className="z-10 flex flex-col items-center gap-4 flex-1 justify-center -mt-4">
          <AnimatedStepIcon icon={currentStep?.icon || "Droplets"} color={stepColor} />
          
          <BigCountdown
            timeRemaining={timeRemaining}
            totalTime={currentStep?.duration || 0}
            color={stepColor}
          />

          {/* Step label - kept small, visual is primary */}
          <p className="text-lg font-bold" style={{ color: stepColor }}>
            {currentStep?.label}
          </p>

          {/* Pause overlay */}
          {status === "paused" && (
            <div className="bg-amber-400 text-amber-900 px-6 py-2.5 rounded-full font-bold text-lg shadow-xl animate-bounce flex items-center gap-2">
              <Pause className="w-5 h-5" />
              PAUSE
            </div>
          )}
        </div>

        {/* Bottom: overall progress */}
        <div className="z-10 w-full max-w-xs">
          <div className="h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalProgress}%`,
                backgroundColor: stepColor,
                boxShadow: `0 0 10px ${stepColor}80`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══ FINISHED ═══
  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(140, 70%, 85%) 0%, hsl(170, 60%, 80%) 50%, hsl(195, 70%, 85%) 100%)" }}
    >
      <AquaBubbles color="hsl(140, 70%, 60%)" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-8xl mb-4" style={{ animation: "icon-bounce 1s ease-in-out infinite" }}>🎉</div>
        <h2 className="text-5xl sm:text-6xl font-black mb-3" style={{ color: "hsl(140, 70%, 40%)" }}>
          BRAVO !
        </h2>
        <p className="text-2xl font-bold" style={{ color: "hsl(170, 50%, 35%)" }}>
          Tu es tout propre ! ✨
        </p>
      </div>
    </div>
  );
}
