import { useShowerSync } from "@/hooks/useShowerSync";
import { Loader2, Droplets, Sparkles, User, Smile, Pause } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { playStepAlert, playFinalTada } from "@/lib/sounds";
import { useWakeLock } from "@/hooks/useWakeLock";

/* ── Step visual config ── */
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

/* Visual emoji instructions per step - child understands without reading */
const STEP_EMOJI: Record<string, string> = {
  Droplets: "🚿",
  Sparkles: "🧴",
  User: "🧼",
  Smile: "😊",
};

const STEP_INSTRUCTION_EMOJI: Record<string, string[]> = {
  Droplets: ["🚿", "💧", "👦"],   // shower + water + kid
  Sparkles: ["🧴", "💆", "✨"],   // shampoo + head massage + sparkles
  User: ["🧼", "🫧", "🧽"],      // soap + bubbles + scrub
  Smile: ["🚿", "😊", "🎉"],     // rinse + smile + celebrate
};

/* ── Animated icon with big emoji ── */
const AnimatedStepIcon = ({ icon, color }: { icon: string; color: string }) => {
  const emoji = STEP_EMOJI[icon] || "🚿";

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing glow ring */}
      <div
        className="absolute rounded-full animate-ping"
        style={{
          width: 200,
          height: 200,
          backgroundColor: `${color}15`,
          animationDuration: "2s",
        }}
      />
      {/* Outer breathing ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          border: `4px solid ${color}30`,
          animation: "breathe 3s ease-in-out infinite",
        }}
      />
      {/* BIG emoji - universally understood */}
      <div
        className="relative z-10 text-8xl sm:text-9xl"
        style={{ animation: "icon-bounce 2s ease-in-out infinite" }}
      >
        {emoji}
      </div>
    </div>
  );
};

/* ── Instruction strip: 3 emojis showing what to do ── */
const InstructionStrip = ({ icon }: { icon: string }) => {
  const emojis = STEP_INSTRUCTION_EMOJI[icon] || ["🚿", "💧", "👦"];

  return (
    <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
      {emojis.map((e, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-3xl sm:text-4xl">{e}</span>
          {i < emojis.length - 1 && (
            <span className="text-xl text-muted-foreground font-bold">→</span>
          )}
        </span>
      ))}
    </div>
  );
};

/* ── Aquatic bubbles ── */
const AquaBubbles = ({ color }: { color: string }) => {
  const [bubbles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 12 + Math.random() * 35,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.3,
    }))
  );

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
            backgroundColor: color,
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
  return (
    <div className="flex gap-3 items-center">
      {steps.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;
        const c = colors[step.icon] || "hsl(195, 85%, 55%)";
        const emoji = STEP_EMOJI[step.icon] || "🚿";

        return (
          <div key={step.id} className="flex flex-col items-center gap-1">
            <div
              className="rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                width: isActive ? 52 : 40,
                height: isActive ? 52 : 40,
                backgroundColor: isDone ? "hsl(140, 70%, 50%)" : isActive ? c : "hsl(210, 30%, 88%)",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                boxShadow: isActive ? `0 0 20px ${c}60` : "none",
              }}
            >
              {isDone ? (
                <span className="text-xl">✅</span>
              ) : (
                <span className={isActive ? "text-2xl" : "text-lg"}>{emoji}</span>
              )}
            </div>
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
  const progress = totalTime > 0 ? Math.min(1, Math.max(0, timeRemaining / totalTime)) : 0;
  const offset = circumference * (1 - progress);

  const mins = Math.floor(Math.max(0, timeRemaining) / 60);
  const secs = Math.max(0, timeRemaining) % 60;

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
  const prevStepIndexRef = useRef(currentStepIndex);

  // Keep screen awake during shower
  useWakeLock(status === "running" || status === "paused");

  // Play sound on step transition
  useEffect(() => {
    if (prevStepIndexRef.current !== currentStepIndex && status === "running") {
      playStepAlert();
    }
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, status]);

  // Play sound on finish
  useEffect(() => {
    if (status === "finished") {
      playFinalTada();
    }
  }, [status]);

  // Total progress
  const calculateElapsed = () => {
    let elapsed = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      elapsed += activeSteps[i]?.duration || 0;
    }
    elapsed += (currentStep?.duration || 0) - Math.max(0, timeRemaining);
    return Math.max(0, elapsed);
  };
  const elapsed = calculateElapsed();
  const totalProgress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

  // Build QR URL
  const qrUrl = sessionCode
    ? `${window.location.origin}?mode=parent&code=${sessionCode}`
    : "";

  // ═══ WAITING SCREEN ═══
  if (status === "setup" || status === "waiting" || status === "ready") {
    return (
      <div
        className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col items-center justify-center p-4"
        style={{ background: STEP_BG["Droplets"] }}
      >
        <AquaBubbles color="hsl(195, 85%, 75%)" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Cute water emoji */}
          <div className="mb-6 text-6xl" style={{ animation: "icon-bounce 2.5s ease-in-out infinite" }}>
            🚿
          </div>

          {/* Session code + QR */}
          <div className="bg-card/90 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-border shadow-2xl max-w-xs w-full text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Code Magique
            </p>
            <div className="text-5xl sm:text-6xl font-black font-mono text-primary mb-4 tracking-tight">
              {sessionCode || <Loader2 className="animate-spin mx-auto w-10 h-10" />}
            </div>

            {/* QR Code */}
            {sessionCode && (
              <div className="mb-4 flex justify-center">
                <div className="bg-white p-3 rounded-2xl shadow-inner">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="M"
                    bgColor="white"
                    fgColor="hsl(200, 60%, 20%)"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 animate-pulse bg-primary/10 py-2.5 px-4 rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <p className="font-semibold text-xs text-primary">En attente de Papa/Maman...</p>
            </div>
          </div>

          {/* Steps preview */}
          <div className="mt-5 flex gap-3">
            {activeSteps.map((step, i) => (
              <div
                key={step.id}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
                style={{
                  backgroundColor: `${STEP_COLORS[step.icon] || "hsl(195, 85%, 55%)"}30`,
                  animation: "icon-bounce 3s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                {STEP_EMOJI[step.icon] || "🚿"}
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

        {/* Top: step dots with emojis */}
        <div className="z-10">
          <StepDots
            steps={activeSteps.map((s) => ({ id: s.id, icon: s.icon }))}
            currentIndex={currentStepIndex}
            colors={STEP_COLORS}
          />
        </div>

        {/* Center: big emoji + timer + instruction */}
        <div className="z-10 flex flex-col items-center gap-4 flex-1 justify-center -mt-4">
          <AnimatedStepIcon icon={currentStep?.icon || "Droplets"} color={stepColor} />

          <BigCountdown
            timeRemaining={timeRemaining}
            totalTime={currentStep?.duration || 0}
            color={stepColor}
          />

          {/* Visual instruction strip - emojis showing what to do */}
          <InstructionStrip icon={currentStep?.icon || "Droplets"} />

          {/* Pause overlay */}
          {status === "paused" && (
            <div className="bg-amber-400 text-amber-900 px-6 py-2.5 rounded-full font-bold text-lg shadow-xl animate-bounce flex items-center gap-2">
              <Pause className="w-5 h-5" />
              ⏸️ PAUSE
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
    <div
      className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(140, 70%, 85%) 0%, hsl(170, 60%, 80%) 50%, hsl(195, 70%, 85%) 100%)",
      }}
    >
      <AquaBubbles color="hsl(140, 70%, 60%)" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-8xl mb-4" style={{ animation: "icon-bounce 1s ease-in-out infinite" }}>
          🎉
        </div>
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
