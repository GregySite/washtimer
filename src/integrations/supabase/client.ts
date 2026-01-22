import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oezvahfwwkqsehsbcrxh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lenZhaGZ3d2txc2Voc2JjcnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjQwMDUsImV4cCI6MjA4NDI0MDAwNX0.L_ARv5JAxy9Qar6C516Nlf_aLpghwh2nneeghDmtki4';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
