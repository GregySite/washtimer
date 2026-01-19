import { useShowerSync } from "@/hooks/useShowerSync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tv, Loader2, PartyPopper } from "lucide-react";

export default function ChildView() {
  const { sessionCode, status, steps, currentStepIndex, timeLeft, updateSession } = useShowerSync('child');

  if (status === 'setup') {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6 text-center">
        <Card className="p-10 w-full max-w-lg shadow-2xl rounded-3xl">
          <Tv className="w-20 h-20 mx-auto text-sky-500 mb-6" />
          <p className="text-xl mb-4">Code pour Papa / Maman :</p>
          <div className="bg-sky-100 p-8 rounded-2xl mb-8 font-mono text-7xl font-black text-sky-600">{sessionCode}</div>
          <div className="flex justify-center items-center gap-2 text-sky-400 animate-pulse"><Loader2 className="animate-spin" /> Attente...</div>
        </Card>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
        <Button onClick={() => updateSession({ status: 'ready' })} className="w-72 h-72 rounded-full text-5xl font-black bg-green-500 shadow-2xl border-[12px] border-white text-white">JE SUIS PRÊT !</Button>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 text-center">
        <PartyPopper className="w-32 h-32 text-yellow-500 mb-6 animate-bounce" />
        <h1 className="text-6xl font-black text-yellow-700">BRAVO !</h1>
        <p className="text-2xl mt-4">Tu es tout propre !</p>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-80 h-80 rounded-full border-[20px] flex flex-col items-center justify-center shadow-2xl transition-all duration-500" style={{ borderColor: currentStep?.color }}>
        <h2 className="text-3xl font-black uppercase" style={{ color: currentStep?.color }}>{currentStep?.label}</h2>
        <span className="text-8xl font-mono font-bold">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
      </div>
      <div className="mt-12 flex gap-3">
        {steps.map((s, i) => (
          <div key={s.id} className="h-4 w-12 rounded-full transition-all" style={{ backgroundColor: s.color, opacity: i <= currentStepIndex ? 1 : 0.2 }} />
        ))}
      </div>
    </div>
  );
}