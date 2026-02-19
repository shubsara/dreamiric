import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Brain, MessageCircle, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreamChat } from "@/components/DreamChat";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  image_url: string | null;
  interpretation: string | null;
  symbols: Array<{ name: string; meaning: string }> | null;
  created_at: string;
}

interface DreamViewProps {
  dreamId: string;
  onBack: () => void;
}

export function DreamView({ dreamId, onBack }: DreamViewProps) {
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"interpretation" | "chat">("interpretation");
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    fetchDream();
  }, [dreamId]);

  const fetchDream = async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("id", dreamId)
      .single();

    if (!error && data) {
      setDream({
        ...data,
        symbols: Array.isArray(data.symbols) ? (data.symbols as Array<{ name: string; meaning: string }>) : [],
      });
    }
    setLoading(false);
  };

  const date = dream
    ? new Date(dream.created_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Moon className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground font-body text-sm">Loading dream...</p>
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-body">Dream not found</p>
          <Button onClick={onBack} variant="outline" size="sm">Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-dream-in">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Journal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold text-foreground leading-tight">
              {dream.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-body">{date}</span>
            {dream.emotional_theme && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-sm font-body flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-dream-glow font-medium">{dream.emotional_theme}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Surrealist image */}
        {dream.image_url ? (
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] nebula-border">
            <img
              src={dream.image_url}
              alt={`Surrealist visualization of: ${dream.title}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3">
              <span className="text-xs text-muted-foreground font-body bg-background/60 px-2 py-1 rounded-full backdrop-blur-sm">
                AI Dream Visualization
              </span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-dream-aurora flex items-center justify-center nebula-border">
            <Moon className="w-16 h-16 text-primary/20" />
            <p className="absolute bottom-3 text-xs text-muted-foreground font-body">Visualization pending...</p>
          </div>
        )}

        {/* Dream transcript */}
        <div className="bg-dream-card rounded-2xl p-5 nebula-border space-y-3">
          <h3 className="font-display text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Dream Transcript
          </h3>
          <div className="relative">
            <p
              className={cn(
                "font-body text-sm text-foreground/80 leading-relaxed",
                !showFullText && "line-clamp-4"
              )}
            >
              {dream.dream_text}
            </p>
            {dream.dream_text.length > 300 && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="flex items-center gap-1 text-xs text-primary font-body mt-2 hover:opacity-80 transition-opacity"
              >
                {showFullText ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Read more</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Symbols */}
        {dream.symbols && dream.symbols.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Key Symbols
            </h3>
            <div className="flex flex-wrap gap-2">
              {dream.symbols.map((symbol, i) => (
                <div
                  key={i}
                  className="group relative"
                  title={symbol.meaning}
                >
                  <span className="px-3 py-1.5 rounded-full text-sm font-body bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-default">
                    {symbol.name}
                  </span>
                </div>
              ))}
            </div>
            {/* Symbol meanings */}
            <div className="space-y-2">
              {dream.symbols.map((symbol, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="font-body font-medium text-accent/80 min-w-20">{symbol.name}</span>
                  <span className="font-body text-muted-foreground leading-relaxed">{symbol.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Interpretation + Chat */}
        <div className="space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-border bg-muted p-1 gap-1">
            <button
              onClick={() => setActiveTab("interpretation")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-body font-medium transition-all",
                activeTab === "interpretation"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Brain className="w-4 h-4" />
              Jungian Analysis
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-body font-medium transition-all",
                activeTab === "chat"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Explore Symbols
            </button>
          </div>

          {activeTab === "interpretation" ? (
            <div className="bg-dream-card rounded-2xl p-6 nebula-border space-y-4">
              {dream.interpretation ? (
                <div className="dream-prose font-body text-sm text-foreground/85 leading-relaxed space-y-3">
                  {dream.interpretation.split("\n").filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-body text-sm">
                  Interpretation is being generated...
                </p>
              )}
            </div>
          ) : (
            <div className="bg-dream-card rounded-2xl p-6 nebula-border h-96 flex flex-col">
              <DreamChat
                dreamId={dream.id}
                dreamText={dream.dream_text}
                interpretation={dream.interpretation || ""}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
