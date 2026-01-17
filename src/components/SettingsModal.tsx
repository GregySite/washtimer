import { X, Clock } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDuration: number;
  onDurationChange: (duration: number) => void;
}

const SettingsModal = ({ isOpen, onClose, totalDuration, onDurationChange }: SettingsModalProps) => {
  const [tempDuration, setTempDuration] = useState(totalDuration);

  if (!isOpen) return null;

  const handleSave = () => {
    onDurationChange(tempDuration);
    onClose();
  };

  const presets = [5, 8, 10, 12, 15];

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Réglages
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-card-foreground mb-3">
              Durée totale de la douche
            </label>
            
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setTempDuration(minutes * 60)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    tempDuration === minutes * 60
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={180}
              max={1200}
              step={60}
              value={tempDuration}
              onChange={(e) => setTempDuration(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none bg-muted cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((tempDuration - 180) / (1200 - 180)) * 100}%, hsl(var(--muted)) ${((tempDuration - 180) / (1200 - 180)) * 100}%, hsl(var(--muted)) 100%)`
              }}
            />
            <div className="text-center text-2xl font-bold text-primary mt-2">
              {Math.floor(tempDuration / 60)} minutes
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
