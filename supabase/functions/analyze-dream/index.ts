import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { dreamText, dreamId, analysisLanguage = "auto" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify user owns this dream
    const { data: dream, error: dreamError } = await supabase
      .from("dreams")
      .select("id")
      .eq("id", dreamId)
      .eq("user_id", userId)
      .single();

    if (dreamError || !dream) {
      return new Response(JSON.stringify({ error: "Dream not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine output language instruction
    const langInstruction = analysisLanguage === "auto" || analysisLanguage === "dream"
      ? "Detect the language of the dream text and write ALL output fields (title, emotional_theme, interpretation, symbol names and meanings) in that same language."
      : `Write ALL output fields (title, emotional_theme, interpretation, symbol names and meanings) in ${analysisLanguage}, regardless of the language the dream was written in.`;

    const imagePromptInstruction = "IMPORTANT: The image_prompt field must always be written in English regardless of output language.";

    // Step 1: Get psychological interpretation
    const interpretationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a depth psychology analyst specializing in dream analysis through Jungian archetypes, the collective unconscious, shadow work, anima/animus, and individuation. 
            Be profound, empathetic, and insightful. Use poetic but accessible language.
            ${langInstruction}
            ${imagePromptInstruction}
            Always structure your response as valid JSON.`,
          },
          {
            role: "user",
            content: `Analyze this dream and return a JSON object with these exact fields:
            {
              "title": "A poetic 3-5 word title for this dream (in the output language)",
              "emotional_theme": "The core emotional theme in 1-3 words (in the output language)",
              "image_prompt": "A vivid surrealist art prompt IN ENGLISH for generating an image that captures the emotional essence of this dream. Describe the visual style as: dreamlike, surrealist painting, ethereal, melting reality, reminiscent of Salvador Dali or Remedios Varo, rich in symbolic imagery, cinematic lighting. Include the main symbolic elements.",
              "interpretation": "A structured 3-paragraph psychological interpretation covering: 1) The archetypal themes and figures present, 2) What the unconscious might be communicating about the dreamer's individuation journey, 3) Practical insights for waking life integration. Use empathetic, insightful language. Write in the output language.",
              "symbols": [
                {"name": "symbol name in output language", "meaning": "brief Jungian meaning in output language"}
              ]
            }
            
            Dream to analyze: "${dreamText}"`,
          },
        ],
      }),
    });

    if (!interpretationResponse.ok) {
      throw new Error(`Analysis failed: ${interpretationResponse.status}`);
    }

    const interpretationData = await interpretationResponse.json();
    let analysisText = interpretationData.choices?.[0]?.message?.content || "";
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(analysisText);

    // Step 2: Generate surrealist image
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: analysis.image_prompt + ", masterpiece quality, ultra high resolution, rich detail, cinematic lighting, no text, no words, no letters, no watermarks" }],
        modalities: ["image", "text"],
      }),
    });

    let imageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (base64Image) {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const fileName = `dream-${dreamId}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("dream-images")
          .upload(fileName, bytes.buffer, { contentType: "image/png" });
        if (!uploadError && uploadData) {
          const { data: publicUrl } = supabase.storage.from("dream-images").getPublicUrl(fileName);
          imageUrl = publicUrl.publicUrl;
        }
      }
    }

    // Step 3: Update dream record
    const { error: updateError } = await supabase
      .from("dreams")
      .update({
        title: analysis.title,
        emotional_theme: analysis.emotional_theme,
        interpretation: analysis.interpretation,
        symbols: analysis.symbols,
        image_url: imageUrl,
      })
      .eq("id", dreamId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        title: analysis.title,
        emotional_theme: analysis.emotional_theme,
        interpretation: analysis.interpretation,
        symbols: analysis.symbols,
        image_url: imageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Dream analysis error:", e);
    return new Response(JSON.stringify({ error: "An error occurred during analysis" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
