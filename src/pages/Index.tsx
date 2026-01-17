import { useState } from "react";
import { Settings, Pause, Play } from "lucide-react";
import Bubbles from "@/components/Bubbles";
import TileBackground from "@/components/TileBackground";
import StartButton from "@/components/StartButton";
import StepDisplay from "@/components/StepDisplay";
import Celebration from "@/components/Celebration";
import SettingsModal from "@/components/SettingsModal";
import { useShowerTimer } from "@/hooks/useShowerTimer";

const Index = () => {
  const [totalDuration, setTotalDuration] = useState(10 * 60); // 10 minutes default
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    state,
    currentStep,
    timeRemaining,
    totalProgress,
    start,
    pause,
    resume,
    reset,
  } = useShowerTimer(totalDuration);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background layers */}
      <TileBackground />
      <Bubbles />

      {/* Settings button - always visible except during shower */}
      {state === "idle" && (
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 p-4 bg-card rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Settings className="w-8 h-8 text-muted-foreground" />
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg">
        {/* Idle state - show start button */}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                Ma Douche 🚿
              </h1>
              <p className="text-xl text-muted-foreground">
                {Math.floor(totalDuration / 60)} minutes de douche
              </p>
            </div>
            <StartButton onClick={start} />
            <p className="text-muted-foreground text-center">
              Appuie sur le bouton pour commencer !
            </p>
          </div>
        )}

        {/* Running or paused state - show current step */}
        {(state === "running" || state === "paused") && currentStep && (
          <div className="flex flex-col items-center gap-6 w-full">
            <StepDisplay
              step={currentStep}
              timeRemaining={timeRemaining}
              totalProgress={totalProgress}
            />

            {/* Pause/Resume button */}
            <button
              onClick={state === "running" ? pause : resume}
              className="big-button w-20 h-20 bg-secondary text-secondary-foreground flex items-center justify-center"
            >
              {state === "running" ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            {/* Stop button */}
            <button
              onClick={reset}
              className="text-muted-foreground underline"
            >
              Arrêter la douche
            </button>
          </div>
        )}

        {/* Completed state - show celebration */}
        {state === "completed" && <Celebration onRestart={reset} />}
      </div>

      {/* Decorative bathroom elements */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/10 to-transparent z-0" />

      {/* Settings modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        totalDuration={totalDuration}
        onDurationChange={setTotalDuration}
      />
    </div>
  );
};

export default Index;
