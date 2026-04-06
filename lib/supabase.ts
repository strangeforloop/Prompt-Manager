import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Default Supabase client (anon key). Use in Route Handlers / server code as needed.
 * TODO: Add a browser-only singleton or `@supabase/ssr` if you use cookies / RLS from the client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
