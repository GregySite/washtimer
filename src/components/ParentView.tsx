import { useState } from "react";
import { useShowerSync } from "../hooks/useShowerSync";
import { DEFAULT_STEPS } from "../lib/constants";
import { Play, Pause, Square } from "lucide-react";

export default function ParentView() {
  const { sessionCode, status, steps, currentStepIndex, updateSession, joinSession } = useShowerSync('parent');
  const [sessionInput, setSessionInput] = useState("");

  const activeSteps = steps.filter(s => s.active);
  const currentStep = activeSteps[currentStepIndex];
  const totalTimeLeft = activeSteps.slice(currentStepIndex).reduce((acc, s) => acc + s.duration, 0);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleStart = async () => {
  if (!sessionInput) return alert("Entre le code d'abord !");
  
  const codeToJoin = sessionInput.trim().toUpperCase();
  console.log("Tentative de connexion au code :", codeToJoin);
  
  try {
    const success = await joinSession(codeToJoin);
    
    if (success) {
      console.log("Connexion réussie, envoi du statut waiting...");
      await updateSession({ 
        status: 'waiting', 
        steps: DEFAULT_STEPS,
        current_step_index: 0 
      });
    } else {
      alert("Le code " + codeToJoin + " n'existe pas. Vérifie l'écran enfant.");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur technique : " + err.message);
  }
};

  // MODIFICATION : Si le statut est 'waiting', on affiche le réglage des temps
  if (status === 'waiting') {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Réglage de la douche</h2>
        {localSteps.map((step, idx) => (
          <div key={step.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
            <span className="font-medium text-slate-700">{step.label}</span>
            <input 
              type="number" 
              className="w-20 p-2 border rounded text-center font-mono"
              value={step.duration / 60}
              onChange={(e) => {
                const newSteps = [...localSteps];
                newSteps[idx].duration = Number(e.target.value) * 60;
                setLocalSteps(newSteps);
              }}
            />
            <span className="text-xs text-slate-400">min</span>
          </div>
        ))}
        <Button 
          className="w-full h-16 bg-green-500 text-white font-bold text-xl mt-6"
          onClick={() => updateSession({ status: 'running', steps: localSteps })}
        >
          C'EST PARTI !
        </Button>
      </div>
    );
  }

  if (status === 'setup' || !sessionCode) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <input 
          style={{ textAlign: 'center', fontSize: '24px', height: '60px', borderRadius: '8px', border: '1px solid #ccc', width: '100%' }}
          placeholder="CODE" 
          value={sessionInput} 
          onChange={e => setSessionInput(e.target.value)} 
        />
        <button 
          style={{ width: '100%', height: '60px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          onClick={handleStart}
        >
          REJOINDRE ET LANCER
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderTop: '8px solid #3b82f6', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape en cours</div>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563eb', margin: '16px 0' }}>{currentStep?.label || "---"}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Temps Étape</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155' }}>{formatTime(currentStep?.duration || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Temps Total</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{formatTime(totalTimeLeft)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {status === 'running' ? (
          <button style={{ height: '60px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => updateSession({ status: 'paused' })}>
            <Pause style={{ marginRight: '8px' }} /> PAUSE
          </button>
        ) : (
          <button style={{ height: '60px', borderRadius: '12px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => updateSession({ status: 'running' })}>
            <Play style={{ marginRight: '8px' }} /> REPRENDRE
          </button>
        )}
        <button style={{ height: '60px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => updateSession({ status: 'setup', current_step_index: 0 })}>
          <Square style={{ marginRight: '8px' }} /> STOP
        </button>
      </div>
    </div>
  );
}