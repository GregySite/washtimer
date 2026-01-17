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
    // Create initial bubbles
    const initialBubbles: Bubble[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 20 + Math.random() * 40,
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 10,
    }));
    setBubbles(initialBubbles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            width: bubble.size,
            height: bubble.size,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
