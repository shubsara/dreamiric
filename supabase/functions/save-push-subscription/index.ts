import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "DELETE") {
      // Unsubscribe: remove by endpoint
      const { endpoint } = await req.json();
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const subscription = await req.json();
      const { endpoint, keys } = subscription;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return new Response(JSON.stringify({ error: "Invalid subscription" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userAgent = req.headers.get("user-agent") || null;

      // Upsert so re-subscribing works
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-push-subscription error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
