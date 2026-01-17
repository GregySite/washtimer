import { Droplets } from "lucide-react";

interface StartButtonProps {
  onClick: () => void;
}

const StartButton = ({ onClick }: StartButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="big-button pulse-glow w-48 h-48 md:w-64 md:h-64 bg-primary text-primary-foreground flex flex-col items-center justify-center gap-2 md:gap-4"
    >
      <Droplets className="w-12 h-12 md:w-16 md:h-16" />
      <span>C'est parti !</span>
    </button>
  );
};

export default StartButton;
