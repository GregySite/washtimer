export interface Step {
  id: string;
  label: string;
  duration: number; // en secondes
  active: boolean;
  icon: string; // Nom de l'icône
}

export const DEFAULT_STEPS: Step[] = [
  { id: '1', label: 'Rinçage', duration: 180, active: true, icon: 'Droplets' }, // 3 min
  { id: '2', label: 'Shampooing', duration: 120, active: true, icon: 'Sparkles' }, // 2 min
  { id: '3', label: 'Gel Douche', duration: 180, active: true, icon: 'User' }, // 3 min
  { id: '4', label: 'Rinçage Détente', duration: 300, active: true, icon: 'Smile' }, // 5 min
];