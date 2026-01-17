import { useState, useEffect, useCallback } from "react";
import { Settings, Pause, Play, Wifi } from "lucide-react";
import Bubbles from "@/components/Bubbles";
import TileBackground from "@/components/TileBackground";
import StartButton from "@/components/StartButton";
import StepDisplay from "@/components/StepDisplay";
import Celebration from "@/components/Celebration";
import SettingsModal from "@/components/SettingsModal";
import SessionCode from "@/components/SessionCode";
import JoinSession from "@/components/JoinSession";
import RemoteControl from "@/components/RemoteControl";
import { useShowerTimer, ShowerState } from "@/hooks/useShowerTimer";
import { useShowerSession } from "@/hooks/useShowerSession";

const Index = () => {
  const [totalDuration, setTotalDuration] = useState(10 * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<'none' | 'host' | 'remote'>('none');

  const {
    session,
    sessionCode,
    isHost,
    loading: sessionLoading,
    error: sessionError,
    createSession,
    joinSession,
    updateSession,
    leaveSession,
  } = useShowerSession();

  // Callback to sync state to database
  const handleStateChange = useCallback((state: ShowerState, stepIndex: number, timeRemaining: number) => {
    if (isHost && session) {
      updateSession({
        state,
        current_step_index: stepIndex,
        time_remaining: timeRemaining,
      });
    }
  }, [isHost, session, updateSession]);

  const timer = useShowerTimer(totalDuration, {
    onStateChange: handleStateChange,
  });

  // Sync duration to session when changed
  useEffect(() => {
    if (isHost && session) {
      updateSession({ total_duration: totalDuration });
    }
  }, [totalDuration, isHost, session, updateSession]);

  // Sync state from session (for remote mode OR host receiving updates)
  useEffect(() => {
    if (!session) return;
    
    // For remote: sync everything from session
    if (!isHost) {
      setTotalDuration(session.total_duration);
    }
    
    // For host: sync commands from remote (when state is different)
    if (isHost && session.state !== timer.state) {
      timer.syncFromRemote(session.state as ShowerState);
    }
  }, [session, isHost, timer]);

  // Handle host mode
  const handleHostMode = async () => {
    const code = await createSession(totalDuration);
    if (code) {
      setMode('host');
    }
  };

  // Handle remote commands
  const handleRemoteStart = () => {
    updateSession({ state: 'running' });
  };

  const handleRemotePause = () => {
    updateSession({ state: 'paused' });
  };

  const handleRemoteResume = () => {
    updateSession({ state: 'running' });
  };

  const handleRemoteStop = () => {
    updateSession({ state: 'idle', current_step_index: 0, time_remaining: 0 });
  };

  const handleRemoteReset = () => {
    updateSession({ state: 'idle', current_step_index: 0, time_remaining: 0 });
  };

  const handleLeave = () => {
    leaveSession();
    setMode('none');
  };

  // Show join screen if in remote mode but not connected
  if (mode === 'remote' && !session) {
    return (
      <JoinSession 
        onJoin={async (code) => {
          const success = await joinSession(code);
          return success;
        }}
        loading={sessionLoading}
        error={sessionError}
      />
    );
  }

  // Show remote control if connected as remote
  if (session && !isHost) {
    return (
      <>
        <RemoteControl
          state={session.state as ShowerState}
          currentStepIndex={session.current_step_index}
          timeRemaining={session.time_remaining}
          totalDuration={session.total_duration}
          onStart={handleRemoteStart}
          onPause={handleRemotePause}
          onResume={handleRemoteResume}
          onStop={handleRemoteStop}
          onReset={handleRemoteReset}
          onLeave={handleLeave}
          onOpenSettings={() => setShowSettings(true)}
        />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          totalDuration={session.total_duration}
          onDurationChange={(duration) => {
            updateSession({ total_duration: duration });
          }}
        />
      </>
    );
  }

  // Mode selection screen
  if (mode === 'none') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
        <TileBackground />
        <Bubbles />
        
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Ma Douche 🚿
            </h1>
            <p className="text-xl text-muted-foreground">
              Comment veux-tu utiliser l'app ?
            </p>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={handleHostMode}
              className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex flex-col items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
            >
              <span className="text-4xl">📱➡️🖥️</span>
              <span>Mode iPad (enfant)</span>
              <span className="text-sm font-normal opacity-80">Affiche le timer de douche</span>
            </button>

            <button
              onClick={() => setMode('remote')}
              className="w-full py-6 bg-secondary text-secondary-foreground rounded-3xl font-bold text-xl flex flex-col items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
            >
              <Wifi className="w-8 h-8" />
              <span>Mode Télécommande</span>
              <span className="text-sm font-normal opacity-80">Contrôle depuis mon téléphone</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Host mode - main shower interface
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <TileBackground />
      <Bubbles />

      {/* Settings button */}
      {timer.state === "idle" && (
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 p-4 bg-card rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Settings className="w-8 h-8 text-muted-foreground" />
        </button>
      )}

      {/* Session code display */}
      {sessionCode && timer.state === "idle" && (
        <div className="absolute top-4 left-4 z-50">
          <SessionCode code={sessionCode} />
        </div>
      )}

      {/* Leave button */}
      <button
        onClick={handleLeave}
        className="absolute bottom-4 left-4 p-3 bg-card/80 rounded-full shadow-lg z-50 text-muted-foreground hover:text-foreground transition-colors"
      >
        Quitter
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg">
        {timer.state === "idle" && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                Ma Douche 🚿
              </h1>
              <p className="text-xl text-muted-foreground">
                {Math.floor(totalDuration / 60)} minutes de douche
              </p>
            </div>
            <StartButton onClick={timer.start} />
            <p className="text-muted-foreground text-center">
              Appuie sur le bouton pour commencer !
            </p>
          </div>
        )}

        {(timer.state === "running" || timer.state === "paused") && timer.currentStep && (
          <div className="flex flex-col items-center gap-6 w-full">
            <StepDisplay
              step={timer.currentStep}
              timeRemaining={timer.timeRemaining}
              totalProgress={timer.totalProgress}
            />

            <button
              onClick={timer.state === "running" ? timer.pause : timer.resume}
              className="big-button w-20 h-20 bg-secondary text-secondary-foreground flex items-center justify-center"
            >
              {timer.state === "running" ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            <button
              onClick={timer.reset}
              className="text-muted-foreground underline"
            >
              Arrêter la douche
            </button>
          </div>
        )}

        {timer.state === "completed" && <Celebration onRestart={timer.reset} />}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/10 to-transparent z-0" />

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
