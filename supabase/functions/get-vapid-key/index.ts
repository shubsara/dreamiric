import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");

  if (!VAPID_PUBLIC_KEY) {
    return new Response(
      JSON.stringify({ error: "VAPID keys not configured yet" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
