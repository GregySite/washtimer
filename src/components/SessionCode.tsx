import { Copy, Check, Smartphone } from "lucide-react";
import { useState } from "react";

interface SessionCodeProps {
  code: string;
}

const SessionCode = ({ code }: SessionCodeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
        <Smartphone className="w-4 h-4" />
        <span>Code télécommande</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-mono font-bold tracking-widest text-primary">
          {code}
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          title="Copier le code"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Entrez ce code sur votre téléphone
      </p>
    </div>
  );
};

export default SessionCode;
