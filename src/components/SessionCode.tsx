import { Copy, Check, Smartphone } from "lucide-react";
import { useState } from "react";

interface SessionCodeProps {
  code: string;
}

const SessionCode = ({ code }: SessionCodeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = function() {
    // Use execCommand as fallback for iOS 9
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function() {
          setCopied(true);
          setTimeout(function() { setCopied(false); }, 2000);
        }).catch(function() {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }
    } catch (err) {
      fallbackCopy();
    }
  };

  const fallbackCopy = function() {
    var textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div 
      className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '1rem',
        padding: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div 
        className="flex items-center gap-2 text-muted-foreground text-sm mb-2"
        style={{
          display: '-webkit-flex',
          WebkitAlignItems: 'center',
          color: '#4a7a8a',
          fontSize: '0.875rem',
          marginBottom: '0.5rem',
        }}
      >
        <Smartphone className="w-4 h-4" />
        <span>Code télécommande</span>
      </div>
      <div 
        className="flex items-center gap-3"
        style={{
          display: '-webkit-flex',
          WebkitAlignItems: 'center',
        }}
      >
        <div 
          className="text-3xl font-mono font-bold tracking-widest text-primary"
          style={{
            fontSize: '1.875rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#14b8d4',
          }}
        >
          {code}
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#c5dfe8',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" style={{ color: '#22c55e' }} />
          ) : (
            <Copy className="w-5 h-5 text-muted-foreground" style={{ color: '#4a7a8a' }} />
          )}
        </button>
      </div>
      <p 
        className="text-xs text-muted-foreground mt-2"
        style={{ fontSize: '0.75rem', color: '#4a7a8a', marginTop: '0.5rem' }}
      >
        Entrez ce code sur votre téléphone
      </p>
    </div>
  );
};

export default SessionCode;
