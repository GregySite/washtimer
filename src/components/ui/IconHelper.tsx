import { Droplets, Sparkles, User, Smile, Play, Timer, CheckCircle2 } from "lucide-react";

export const IconHelper = ({ name, className }: { name: string, className?: string }) => {
  switch (name) {
    case 'Droplets': return <Droplets className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'User': return <User className={className} />;
    case 'Smile': return <Smile className={className} />;
    default: return <Timer className={className} />;
  }
};