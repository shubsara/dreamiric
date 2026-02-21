import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await authSupabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Only fetch THIS user's dreams
    const { data: dreams, error: dreamsError } = await supabase
      .from("dreams")
      .select("id, title, dream_text, emotional_theme, interpretation, symbols, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (dreamsError) throw dreamsError;
    if (!dreams || dreams.length === 0) {
      return new Response(JSON.stringify({ error: "No dreams found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dreamIds = dreams.map((d) => d.id);
    const { data: messages } = await supabase
      .from("dream_messages")
      .select("dream_id, role, content, created_at")
      .in("dream_id", dreamIds)
      .order("created_at", { ascending: true });

    // Build a compact context string
    const dreamsContext = dreams.map((d) => {
      const date = d.created_at.slice(0, 10);
      const symbols = Array.isArray(d.symbols)
        ? (d.symbols as Array<{ name: string }>).map((s) => s.name).join(", ")
        : "";
      const chatMessages = (messages || [])
        .filter((m) => m.dream_id === d.id)
        .map((m) => `  [${m.role}]: ${m.content}`)
        .join("\n");

      return `--- Dream (${date}): "${d.title}" ---
Emotional theme: ${d.emotional_theme || "unknown"}
Dream text: ${d.dream_text.slice(0, 400)}${d.dream_text.length > 400 ? "..." : ""}
Symbols: ${symbols || "none"}
Analysis: ${(d.interpretation || "").slice(0, 300)}${(d.interpretation || "").length > 300 ? "..." : ""}
${chatMessages ? `Dream chat:\n${chatMessages.slice(0, 600)}` : ""}`;
    }).join("\n\n");

    const systemPrompt = `You are a depth psychologist specializing in Jungian analysis, dream work, and the psychology of the unconscious. 
You will be given a person's complete dream journal — including dream texts, emotional themes, symbols, AI analyses, and their own chat conversations exploring symbols.

Your task is to synthesize all of this into a holistic psychological profile of the dreamer from a Jungian perspective.

Return a JSON object with EXACTLY this structure (no markdown, no code fences, raw JSON only):
{
  "dominantArchetypes": [
    { "name": "string (archetype name)", "description": "string (2-3 sentences about how this archetype manifests)", "evidence": "string (specific dreams or symbols that point to this)" }
  ],
  "shadowAspects": "string (paragraph about shadow material appearing in dreams)",
  "animaAnimus": "string (paragraph about the anima/animus, or null if not evident)",
  "selfJourney": "string (paragraph about the individuation process and where the dreamer is on their journey)",
  "recurringThemes": [
    { "theme": "string", "psychologicalMeaning": "string (1-2 sentences)" }
  ],
  "unconsciousMessages": "string (paragraph - what the unconscious seems to be communicating most urgently)",
  "growthEdges": ["string", "string", "string"],
  "overallTone": "string (one of: integrating, shadow-confronting, transforming, seeking, wounded-healer, ascending)",
  "summary": "string (2-3 sentence overall psychological portrait)"
}

Be specific, drawing from actual content in their dreams. Be empathetic yet psychologically precise. Write in clear, accessible language — not academic jargon.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is the complete dream journal (${dreams.length} dreams):\n\n${dreamsContext}\n\nPlease generate the psychological profile JSON.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    const jsonStr = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let profile;
    try {
      profile = JSON.parse(jsonStr);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ profile, dreamCount: dreams.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Psychological profile error:", e);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
