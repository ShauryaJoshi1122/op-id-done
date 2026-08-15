// ========================================
// SUPABASE STORAGE CONFIGURATION
// ========================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://xssdmpqvkggpgpxwjrqc.supabase.co"; 

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2RtcHF2a2dncGdweHdqcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDAxMzYsImV4cCI6MjA5NzUxNjEzNn0.B26kqN3agcwVYbOZV7UpYGgMMaJpHYY_ITfNof-nWlo"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const BUCKET_NAME = "thamarai-assets";
