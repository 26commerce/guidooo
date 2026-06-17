import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Eén gedeelde client voor het hele project.
// Gebruikt de publieke anon key, prima voor read-only tourdata.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
