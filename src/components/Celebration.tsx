import { Star, PartyPopper } from "lucide-react";

interface CelebrationProps {
  onRestart: () => void;
}

const Celebration = ({ onRestart }: CelebrationProps) => {
  return (
    <div 
      className="flex flex-col items-center gap-8 text-center celebration"
      style={{
        display: '-webkit-flex',
        WebkitFlexDirection: 'column',
        WebkitAlignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Stars decoration */}
      <div 
        className="flex items-center gap-4"
        style={{
          display: '-webkit-flex',
          WebkitAlignItems: 'center',
        }}
      >
        <Star 
          className="w-12 h-12 text-accent fill-accent animate-wiggle" 
          style={{ color: '#f5c542', fill: '#f5c542' }}
        />
        <PartyPopper 
          className="w-20 h-20 text-success"
          style={{ color: '#22c55e' }}
        />
        <Star 
          className="w-12 h-12 text-accent fill-accent animate-wiggle" 
          style={{ 
            color: '#f5c542', 
            fill: '#f5c542',
            WebkitAnimationDelay: '0.2s',
            animationDelay: '0.2s',
          }} 
        />
      </div>

      {/* Success message */}
      <div>
        <h1 
          className="text-4xl md:text-5xl font-bold text-success mb-4"
          style={{ color: '#22c55e', fontWeight: 700, marginBottom: '1rem' }}
        >
          Bravo ! 🎉
        </h1>
        <p 
          className="text-2xl md:text-3xl text-foreground mb-2"
          style={{ color: '#1a4a5c', marginBottom: '0.5rem' }}
        >
          Tu es tout propre !
        </p>
        <p 
          className="text-xl text-muted-foreground"
          style={{ color: '#4a7a8a' }}
        >
          Tu as terminé ta douche comme un champion !
        </p>
      </div>

      {/* Duck emoji animation */}
      <div 
        className="text-8xl animate-bounce"
        style={{ fontSize: '6rem' }}
      >
        🦆
      </div>

      {/* Restart button */}
      <button
        onClick={onRestart}
        className="big-button px-12 py-6 bg-success text-success-foreground"
        style={{
          backgroundColor: '#22c55e',
          color: '#ffffff',
          paddingLeft: '3rem',
          paddingRight: '3rem',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          borderRadius: '9999px',
          fontWeight: 700,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Recommencer
      </button>
    </div>
  );
};

export default Celebration;
