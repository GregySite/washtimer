import { createClient } from '@supabase/supabase-js';

// Remplace 'TA_CLE_ANON_ICI' par la longue suite de caractères que tu as copiée
const supabaseUrl = 'https://sojsinqouukjmikuwobi.supabase.co';
const supabaseAnonKey = 'sb_publishable_udX9RHMz-9CLqroOs-irTA_DwUYRHXQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);