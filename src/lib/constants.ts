export const DEFAULT_STEPS = [
  { id: 'rincage', label: 'Rinçage', duration: 90, active: true, color: '#0EA5E9' },
  { id: 'shampooing', label: 'Shampooing', duration: 150, active: true, color: '#8B5CF6' },
  { id: 'savon', label: 'Gel douche', duration: 210, active: true, color: '#F43F5E' },
  { id: 'final', label: 'Rinçage Final', duration: 150, active: true, color: '#10B981' },
];

export type Step = typeof DEFAULT_STEPS[0];