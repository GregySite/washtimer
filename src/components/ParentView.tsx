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
    const success = await joinSession(sessionInput);
    if (success) {
      await updateSession({ 
        status: 'running', 
        steps: DEFAULT_STEPS, 
        current_step_index: 0 
      });
    }
  };

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