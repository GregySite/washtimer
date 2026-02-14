import { useState, useEffect } from "react";
import ParentView from "@/components/ParentView";
import ChildView from "@/components/ChildView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Baby, Settings2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY_MODE = 'timewash_mode';
const STORAGE_KEY_CODE = 'timewash_session_code';

type ActiveSession = {
  mode: 'parent' | 'child';
  code: string;
  state: string;
};

export default function Index() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [appMode, setAppMode] = useState<'select' | 'parent' | 'child'>(() => {
    // Check URL params for QR code deep link
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlCode = params.get('code');
    if (urlMode === 'parent' && urlCode) {
      localStorage.setItem(STORAGE_KEY_MODE, 'parent');
      localStorage.setItem(STORAGE_KEY_CODE, urlCode.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
      return 'parent';
    }

    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    const code = localStorage.getItem(STORAGE_KEY_CODE);
    if (saved && code && (saved === 'parent' || saved === 'child')) return saved;
    return 'select';
  });

  // On mount, check if there's a saved session that's still active
  useEffect(() => {
    if (appMode !== 'select') {
      setCheckingSession(false);
      return;
    }

    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    const savedCode = localStorage.getItem(STORAGE_KEY_CODE);

    if (!savedMode || !savedCode) {
      setCheckingSession(false);
      return;
    }

    // Check if the session is still active in DB
    const checkSession = async () => {
      const { data } = await supabase
        .from("shower_sessions")
        .select("state")
        .eq("session_code", savedCode)
        .maybeSingle();

      if (data && ['waiting', 'running', 'paused', 'ready'].includes(data.state)) {
        setActiveSession({
          mode: savedMode as 'parent' | 'child',
          code: savedCode,
          state: data.state,
        });
      } else {
        // Session no longer active, clean up
        localStorage.removeItem(STORAGE_KEY_MODE);
        localStorage.removeItem(STORAGE_KEY_CODE);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [appMode]);

  const handleResume = () => {
    if (!activeSession) return;
    setAppMode(activeSession.mode);
  };

  const handleSelectMode = (mode: 'parent' | 'child') => {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    setAppMode(mode);
  };

  const handleSwitchMode = () => {
    // Don't clear session data — just go to select screen
    // This allows resuming later
    setAppMode('select');
    setCheckingSession(true); // re-check active session
  };

  if (appMode === 'select') {
    const stateLabel: Record<string, string> = {
      running: "en cours 🚿",
      paused: "en pause ⏸️",
      waiting: "en attente ⏳",
      ready: "prête 🟢",
    };

    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-4xl font-bold text-sky-900 mb-8">TimeWash v2.0</h1>

          {/* Resume banner */}
          {!checkingSession && activeSession && (
            <Card className="p-5 border-2 border-emerald-400 bg-emerald-50 shadow-lg rounded-2xl space-y-3">
              <p className="text-lg font-bold text-emerald-800">
                Session {stateLabel[activeSession.state] || "active"} !
              </p>
              <p className="text-sm text-emerald-700">
                Mode {activeSession.mode === 'child' ? 'Enfant' : 'Parent'} · Code {activeSession.code}
              </p>
              <Button
                className="w-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl"
                onClick={handleResume}
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Reprendre la session
              </Button>
            </Card>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <Card 
              className="p-8 cursor-pointer hover:border-sky-500 transition-all shadow-lg border-2"
              onClick={() => handleSelectMode('child')}
            >
              <Baby className="w-16 h-16 mx-auto text-sky-500 mb-4" />
              <h2 className="text-2xl font-bold">Mode Enfant</h2>
              <p className="text-muted-foreground mt-2">Pour l'écran dans la douche</p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:border-pink-500 transition-all shadow-lg border-2"
              onClick={() => handleSelectMode('parent')}
            >
              <Settings2 className="w-16 h-16 mx-auto text-pink-500 mb-4" />
              <h2 className="text-2xl font-bold">Mode Parent</h2>
              <p className="text-muted-foreground mt-2">Pour piloter et configurer</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {appMode === 'parent' ? <ParentView /> : <ChildView />}
      <Button 
        variant="ghost" 
        className="fixed bottom-2 right-2 opacity-20 hover:opacity-100 z-50"
        onClick={handleSwitchMode}
      >
        Changer de mode
      </Button>
    </>
  );
}