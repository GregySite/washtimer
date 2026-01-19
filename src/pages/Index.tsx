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
import { StepConfig } from "@/components/StepEditor";

// Styles compatibles iOS 9
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
  var [totalDuration, setTotalDuration] = useState(10 * 60);
  var [showSettings, setShowSettings] = useState(false);
  var [mode, setMode] = useState<'none' | 'host' | 'remote'>('none');

  var { 
    session, sessionCode, isHost, loading, error, 
    createSession, joinSession, updateSession, leaveSession, DEFAULT_STEPS 
  } = useShowerSession();

  // iPad envoie son état au smartphone
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

  // Gestion des étapes (Smartphone vers iPad)
  var steps = (session && session.steps) ? session.steps : DEFAULT_STEPS;

  // SYNCHRONISATION : Évite le clignotement
  useEffect(function() {
    if (!session) return;
    
    if (!isHost) {
      setTotalDuration(session.total_duration);
    }
    
    // L'iPad n'écoute que les ordres de changement d'état (Play/Pause/Stop)
    if (isHost && session.state !== timer.state) {
      timer.syncFromRemote(session.state as ShowerState);
    }
  }, [session?.state, isHost]); // On ne surveille que l'état pour éviter les boucles de temps

  // Fonctions de contrôle
  var handleHostMode = function() {
    createSession(totalDuration).then(function(code) {
      if (code) setMode('host');
    });
  };

  var handleStepsChange = function(newSteps: StepConfig[]) {
    var newTotal = 0;
    for (var i = 0; i < newSteps.length; i++) {
      newTotal += newSteps[i].duration;
    }
    updateSession({ steps: newSteps, total_duration: newTotal });
  };

  // Rendu : Écran de connexion Remote
  if (mode === 'remote' && !session) {
    return <JoinSession onJoin={joinSession} loading={loading} error={error} />;
  }

  // Rendu : Interface Télécommande (Smartphone)
  if (session && !isHost) {
    return (
      <RemoteControl
        state={session.state as ShowerState}
        currentStepIndex={session.current_step_index}
        timeRemaining={session.time_remaining}
        totalDuration={session.total_duration}
        steps={steps}
        onStart={() => updateSession({ state: 'running' })}
        onPause={() => updateSession({ state: 'paused' })}
        onResume={() => updateSession({ state: 'running' })}
        onStop={() => updateSession({ state: 'idle', current_step_index: 0 })}
        onReset={() => updateSession({ state: 'idle', current_step_index: 0 })}
        onLeave={() => { leaveSession(); setMode('none'); }}
        onStepsChange={handleStepsChange}
        onTotalDurationChange={(d) => updateSession({ total_duration: d })}
      />
    );
  }

  // Rendu : Sélection du mode
  if (mode === 'none') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden" style={flexColumnCenterJustify}>
        <TileBackground /><Bubbles />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full" style={flexColumnCenter}>
          <h1 className="text-4xl font-bold">Ma Douche 🚿</h1>
          <button onClick={handleHostMode} className="w-full py-6 bg-blue-500 text-white rounded-3xl font-bold text-xl shadow-lg">Mode iPad (enfant)</button>
          <button onClick={() => setMode('remote')} className="w-full py-6 bg-pink-200 text-pink-800 rounded-3xl font-bold text-xl shadow-lg">Mode Télécommande</button>
        </div>
      </div>
    );
  }

  // Rendu : Mode iPad (Host)
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden" style={flexColumnCenterJustify}>
      <TileBackground /><Bubbles />
      
      {sessionCode && timer.state === "idle" && (
        <div className="absolute top-4 left-4 z-50"><SessionCode code={sessionCode} /></div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg" style={flexColumnCenter}>
        {timer.state === "idle" ? (
          <div style={flexColumnCenter}>
            <h1 className="text-4xl font-bold mb-4">Prêt pour la douche ?</h1>
            <StartButton onClick={timer.start} />
          </div>
        ) : (
          <div style={flexColumnCenter} className="w-full">
            <StepDisplay step={timer.currentStep} timeRemaining={timer.timeRemaining} totalProgress={timer.totalProgress} />
            <div className="flex gap-4 mt-8">
               <button onClick={timer.state === "running" ? timer.pause : timer.resume} className="p-6 bg-white rounded-full shadow-xl">
                  {timer.state === "running" ? <Pause /> : <Play />}
               </button>
            </div>
          </div>
        )}
        {timer.state === "completed" && <Celebration onRestart={timer.reset} />}
      </div>
    </div>
  );
};

export default Index;