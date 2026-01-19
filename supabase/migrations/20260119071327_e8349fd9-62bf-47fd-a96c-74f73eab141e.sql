-- Add steps column for custom step configuration
ALTER TABLE public.shower_sessions 
ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[
  {"id": 1, "name": "Rinçage", "icon": "rinse", "duration": 90, "color": "hsl(195, 85%, 55%)", "instruction": "Mouille-toi bien de la tête aux pieds !"},
  {"id": 2, "name": "Shampooing", "icon": "shampoo", "duration": 150, "color": "hsl(280, 60%, 65%)", "instruction": "Frotte bien tes cheveux avec le shampooing !"},
  {"id": 3, "name": "Savonnage", "icon": "soap", "duration": 210, "color": "hsl(340, 60%, 70%)", "instruction": "Lave tout ton corps avec le gel douche !"},
  {"id": 4, "name": "Rinçage final", "icon": "final", "duration": 150, "color": "hsl(140, 70%, 50%)", "instruction": "Rince bien tes cheveux et ton corps !"}
]'::jsonb;