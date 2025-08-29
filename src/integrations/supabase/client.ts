// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ✅ direct anon key version (safe for client use)
export const supabase = createClient<Database>(
  "https://mynptbtzntthbucdmhgz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bnB0YnR6bnR0aGJ1Y2RtaGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODM0ODgsImV4cCI6MjA3MDc1OTQ4OH0.g59zcZt1MGYq8zFS693Bu8qJadnXn-xOLOafLNk9CRA"
);
