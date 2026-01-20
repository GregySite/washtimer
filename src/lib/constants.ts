export interface Step {
  id: string;
  label: string;
  duration: number;
  active: boolean;
}

export const DEFAULT_STEPS: Step[] = [
  { id: '1', label: 'Rinçage', duration: 60, active: true },
  { id: '2', label: 'Savonnage', duration: 180, active: true },
  { id: '3', label: 'Shampooing', duration: 180, active: true },
  { id: '4', label: 'Rinçage Final', duration: 120, active: true },
];