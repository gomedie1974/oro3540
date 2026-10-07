// Configuración pública de Supabase para ORO.
// La Publishable key puede estar en el frontend. La seguridad real está en RLS.
const SUPABASE_URL = 'https://guguwtfrvmhhvgeiyhhf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wg5OCwP8achci8j12ucdkA_WYpugk71';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
