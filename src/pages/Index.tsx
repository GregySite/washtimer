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

// Helper for flex styles compatible with iOS 9
var flexColumnCenter = {
  display: 'flex',
  WebkitBoxOrient: 'vertical' as const,
  WebkitBoxDirection: 'normal' as const,
  WebkitFlexDirection: 'column' as const,
  flexDirection: 'column' as const,
  WebkitBoxAlign: 'center' as const,
  WebkitAlignItems: 'center' as const,
  alignItems: 'center' as const,
};

var flexColumnCenterJustify = {
  ...flexColumnCenter,
  WebkitBoxPack: 'center' as const,
  WebkitJustifyContent: 'center' as const,
  justifyContent: 'center' as const,
};

var Index = function() {
  var durationResult = useState(10 * 60);
  var totalDuration = durationResult[0];
  var setTotalDuration = durationResult[1];
  
  var settingsResult = useState(false);
  var showSettings = settingsResult[0];
  var setShowSettings = settingsResult[1];
  
  var modeResult = useState<'none' | 'host' | 'remote'>('none');
  var mode = modeResult[0];
  var setMode = modeResult[1];

  var sessionHook = useShowerSession();
  var session = sessionHook.session;
  var sessionCode = sessionHook.sessionCode;
  var isHost = sessionHook.isHost;
  var sessionLoading = sessionHook.loading;
  var sessionError = sessionHook.error;
  var createSession = sessionHook.createSession;
  var joinSession = sessionHook.joinSession;
  var updateSession = sessionHook.updateSession;
  var leaveSession = sessionHook.leaveSession;

  // Callback to sync state to database
  var handleStateChange = useCallback(function(state: ShowerState, stepIndex: number, timeRemaining: number) {
    if (isHost && session) {
      updateSession({
        state: state,
        current_step_index: stepIndex,
        time_remaining: timeRemaining,
      });
    }
  }, [isHost, session, updateSession]);

  var timer = useShowerTimer(totalDuration, {
    onStateChange: handleStateChange,
  });

  // Sync duration to session when changed
  useEffect(function() {
    if (isHost && session) {
      updateSession({ total_duration: totalDuration });
    }
  }, [totalDuration, isHost, session, updateSession]);

  // Sync state from session (for remote mode OR host receiving updates)
  useEffect(function() {
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
  var handleHostMode = function() {
    createSession(totalDuration).then(function(code) {
      if (code) {
        setMode('host');
      }
    });
  };

  // Handle remote commands
  var handleRemoteStart = function() {
    updateSession({ state: 'running' });
  };

  var handleRemotePause = function() {
    updateSession({ state: 'paused' });
  };

  var handleRemoteResume = function() {
    updateSession({ state: 'running' });
  };

  var handleRemoteStop = function() {
    updateSession({ state: 'idle', current_step_index: 0, time_remaining: 0 });
  };

  var handleRemoteReset = function() {
    updateSession({ state: 'idle', current_step_index: 0, time_remaining: 0 });
  };

  var handleLeave = function() {
    leaveSession();
    setMode('none');
  };

  // Show join screen if in remote mode but not connected
  if (mode === 'remote' && !session) {
    return (
      <JoinSession 
        onJoin={function(code) {
          return joinSession(code);
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
          onOpenSettings={function() { setShowSettings(true); }}
        />
        <SettingsModal
          isOpen={showSettings}
          onClose={function() { setShowSettings(false); }}
          totalDuration={session.total_duration}
          onDurationChange={function(duration) {
            updateSession({ total_duration: duration });
          }}
        />
      </>
    );
  }

  // Mode selection screen
  if (mode === 'none') {
    return (
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
        style={{ ...flexColumnCenterJustify, minHeight: '100vh', padding: '1rem', overflow: 'hidden', position: 'relative' }}
      >
        <TileBackground />
        <Bubbles />
        
        <div 
          className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full"
          style={{ ...flexColumnCenter, position: 'relative', zIndex: 10, maxWidth: '28rem', width: '100%' }}
        >
          <div className="text-center" style={{ textAlign: 'center' }}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2" style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Ma Douche 🚿
            </h1>
            <p className="text-xl text-muted-foreground" style={{ fontSize: '1.25rem' }}>
              Comment veux-tu utiliser l'app ?
            </p>
          </div>

          <div className="w-full space-y-4" style={{ width: '100%' }}>
            <button
              onClick={handleHostMode}
              className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-bold text-xl flex flex-col items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
              style={{ 
                ...flexColumnCenter,
                width: '100%', 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(195, 80%, 50%)', 
                color: 'white', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '2rem' }}>📱➡️🖥️</span>
              <span>Mode iPad (enfant)</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', opacity: 0.8 }}>Affiche le timer de douche</span>
            </button>

            <button
              onClick={function() { setMode('remote'); }}
              className="w-full py-6 bg-secondary text-secondary-foreground rounded-3xl font-bold text-xl flex flex-col items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
              style={{ 
                ...flexColumnCenter,
                width: '100%', 
                padding: '1.5rem 0', 
                backgroundColor: 'hsl(340, 60%, 85%)', 
                color: 'hsl(340, 60%, 30%)', 
                borderRadius: '1.5rem', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              <Wifi className="w-8 h-8" style={{ width: '2rem', height: '2rem' }} />
              <span>Mode Télécommande</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', opacity: 0.8 }}>Contrôle depuis mon téléphone</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Host mode - main shower interface
  return (
    <div 
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ ...flexColumnCenterJustify, minHeight: '100vh', padding: '1rem', overflow: 'hidden', position: 'relative' }}
    >
      <TileBackground />
      <Bubbles />

      {/* Settings button */}
      {timer.state === "idle" && (
        <button
          onClick={function() { setShowSettings(true); }}
          className="absolute top-4 right-4 p-4 bg-card rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 cursor-pointer touch-manipulation"
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            padding: '1rem', 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            zIndex: 50,
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Settings className="w-8 h-8 text-muted-foreground" style={{ width: '2rem', height: '2rem' }} />
        </button>
      )}

      {/* Session code display */}
      {sessionCode && timer.state === "idle" && (
        <div className="absolute top-4 left-4 z-50" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 50 }}>
          <SessionCode code={sessionCode} />
        </div>
      )}

      {/* Leave button */}
      <button
        onClick={handleLeave}
        className="absolute bottom-4 left-4 p-3 bg-card/80 rounded-full shadow-lg z-50 text-muted-foreground hover:text-foreground transition-colors"
        style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '1rem', 
          padding: '0.75rem', 
          backgroundColor: 'rgba(255,255,255,0.8)', 
          borderRadius: '9999px', 
          zIndex: 50,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Quitter
      </button>

      {/* Main content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg"
        style={{ 
          ...flexColumnCenterJustify,
          WebkitBoxFlex: 1,
          WebkitFlex: 1,
          flex: 1,
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '32rem'
        }}
      >
        {timer.state === "idle" && (
          <div 
            className="flex flex-col items-center gap-8"
            style={flexColumnCenter}
          >
            <div className="text-center" style={{ textAlign: 'center' }}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2" style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Ma Douche 🚿
              </h1>
              <p className="text-xl text-muted-foreground" style={{ fontSize: '1.25rem' }}>
                {Math.floor(totalDuration / 60)} minutes de douche
              </p>
            </div>
            <StartButton onClick={timer.start} />
            <p className="text-muted-foreground text-center" style={{ textAlign: 'center' }}>
              Appuie sur le bouton pour commencer !
            </p>
          </div>
        )}

        {(timer.state === "running" || timer.state === "paused") && timer.currentStep && (
          <div 
            className="flex flex-col items-center gap-6 w-full"
            style={{ ...flexColumnCenter, width: '100%' }}
          >
            <StepDisplay
              step={timer.currentStep}
              timeRemaining={timer.timeRemaining}
              totalProgress={timer.totalProgress}
            />

            <button
              onClick={timer.state === "running" ? timer.pause : timer.resume}
              className="big-button w-20 h-20 bg-secondary text-secondary-foreground flex items-center justify-center"
              style={{ 
                ...flexColumnCenterJustify,
                width: '5rem', 
                height: '5rem', 
                backgroundColor: 'hsl(340, 60%, 85%)', 
                color: 'hsl(340, 60%, 30%)',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {timer.state === "running" ? (
                <Pause className="w-8 h-8" style={{ width: '2rem', height: '2rem' }} />
              ) : (
                <Play className="w-8 h-8 ml-1" style={{ width: '2rem', height: '2rem', marginLeft: '0.25rem' }} />
              )}
            </button>

            <button
              onClick={timer.reset}
              className="text-muted-foreground underline"
              style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Arrêter la douche
            </button>
          </div>
        )}

        {timer.state === "completed" && <Celebration onRestart={timer.reset} />}
      </div>

      <div 
        className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/10 to-transparent z-0"
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '5rem',
          background: 'linear-gradient(to top, hsla(195, 80%, 50%, 0.1), transparent)',
          zIndex: 0
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={function() { setShowSettings(false); }}
        totalDuration={totalDuration}
        onDurationChange={setTotalDuration}
      />
    </div>
  );
};

export default Index;
