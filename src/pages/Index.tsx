import { useState } from "react";
import ParentView from "@/components/ParentView";
import ChildView from "@/components/ChildView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Baby, Settings2 } from "lucide-react";

export default function Index() {
  const [appMode, setAppMode] = useState<'select' | 'parent' | 'child'>(() => {
    // Check URL params for QR code deep link
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlCode = params.get('code');
    if (urlMode === 'parent' && urlCode) {
      localStorage.setItem('timewash_mode', 'parent');
      localStorage.setItem('timewash_session_code', urlCode.toUpperCase());
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      return 'parent';
    }

    const saved = localStorage.getItem('timewash_mode');
    const code = localStorage.getItem('timewash_session_code');
    if (saved && code && (saved === 'parent' || saved === 'child')) return saved;
    return 'select';
  });

  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-4xl font-bold text-sky-900 mb-8">TimeWash v2.0</h1>
          
          <div className="grid grid-cols-1 gap-4">
            <Card 
              className="p-8 cursor-pointer hover:border-sky-500 transition-all shadow-lg border-2"
              onClick={() => setAppMode('child')}
            >
              <Baby className="w-16 h-16 mx-auto text-sky-500 mb-4" />
              <h2 className="text-2xl font-bold">Mode Enfant</h2>
              <p className="text-muted-foreground mt-2">Pour l'écran dans la douche</p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:border-pink-500 transition-all shadow-lg border-2"
              onClick={() => setAppMode('parent')}
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
        onClick={() => {
          localStorage.removeItem('timewash_mode');
          localStorage.removeItem('timewash_session_code');
          setAppMode('select');
        }}
      >
        Changer de mode
      </Button>
    </>
  );
}