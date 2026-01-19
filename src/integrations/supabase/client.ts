import { createClient } from '@supabase/supabase-js';

// Remplace 'TA_CLE_ANON_ICI' par la longue suite de caractères que tu as copiée
const supabaseUrl = 'https://sojsinqouukjmikuwobi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvanNpbnFvdXVram1pa3V3b2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDg3MTYsImV4cCI6MjA4NDQyNDcxNn0.REoauHF31LH3ijyAE4-ei9rJUlBfpLfN9EfjYbqX_vA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);