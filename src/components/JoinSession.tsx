import { useState } from "react";
import { Smartphone, ArrowRight, Loader2 } from "lucide-react";

interface JoinSessionProps {
  onJoin: (code: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const JoinSession = ({ onJoin, loading, error }: JoinSessionProps) => {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (code.length < 6) {
      setLocalError("Le code doit contenir 6 caractères");
      return;
    }

    const success = await onJoin(code.toUpperCase());
    if (!success) {
      setLocalError(error || "Session non trouvée");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setCode(value);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/20 to-background">
      <div className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-primary/20 rounded-full">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-card-foreground mb-2">
          Télécommande Douche
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Entrez le code affiché sur l'iPad
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="CODE"
              className="w-full text-center text-4xl font-mono font-bold tracking-[0.5em] py-4 px-6 bg-muted rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/40"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>

          {(localError || error) && (
            <p className="text-red-500 text-center text-sm">
              {localError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Rejoindre
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinSession;
