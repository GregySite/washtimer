import { useEffect, useState } from "react";

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

const Bubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // Create initial bubbles with simple loop for iOS 9 compatibility
    const initialBubbles: Bubble[] = [];
    for (let i = 0; i < 15; i++) {
      initialBubbles.push({
        id: i,
        left: Math.random() * 100,
        size: 20 + Math.random() * 40,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 10,
      });
    }
    setBubbles(initialBubbles);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            position: 'absolute',
            left: bubble.left + '%',
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(224, 247, 255, 0.6)',
            WebkitAnimationDuration: bubble.duration + 's',
            animationDuration: bubble.duration + 's',
            WebkitAnimationDelay: bubble.delay + 's',
            animationDelay: bubble.delay + 's',
            WebkitAnimationName: 'float-up',
            animationName: 'float-up',
            WebkitAnimationTimingFunction: 'linear',
            animationTimingFunction: 'linear',
            WebkitAnimationIterationCount: 'infinite',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
