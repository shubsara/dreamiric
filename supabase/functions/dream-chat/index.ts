import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dreamId, message, dreamText, interpretation } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get conversation history
    const { data: history } = await supabase
      .from("dream_messages")
      .select("*")
      .eq("dream_id", dreamId)
      .order("created_at", { ascending: true });

    const messages = [
      {
        role: "system",
        content: `You are a depth psychology guide specializing in Jungian dream analysis and symbol interpretation. 
        You are helping someone explore their dream with curiosity, empathy, and psychological insight.
        
        The dream they had: "${dreamText}"
        
        Initial interpretation: "${interpretation || "Not yet analyzed"}"
        
        Guide them to understand the symbols, archetypes, and unconscious messages in their dream. 
        Ask clarifying questions when helpful. Be poetic but clear. Draw from Jung, Campbell, Hillman, and other depth psychologists.
        Keep responses conversational and supportive, typically 2-4 paragraphs maximum.`,
      },
      ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];

    // Save user message
    await supabase.from("dream_messages").insert({
      dream_id: dreamId,
      role: "user",
      content: message,
    });

    // Stream response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // We'll collect the full response to save it
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              
              if (!line || line.startsWith(":")) continue;
              if (!line.startsWith("data: ")) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                // Save assistant message
                await supabase.from("dream_messages").insert({
                  dream_id: dreamId,
                  role: "assistant",
                  content: fullContent,
                });
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  controller.enqueue(new TextEncoder().encode(`data: ${jsonStr}\n\n`));
                }
              } catch { /* ignore parse errors */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Dream chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
