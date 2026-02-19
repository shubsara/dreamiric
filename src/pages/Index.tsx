import { useState, useEffect } from "react";
import { Plus, Moon, BookOpen, Sparkles, Stars, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreamCard } from "@/components/DreamCard";
import { DreamView } from "@/components/DreamView";
import { NewDreamModal } from "@/components/NewDreamModal";
import { supabase } from "@/integrations/supabase/client";

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  image_url: string | null;
  created_at: string;
}

const Index = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [showNewDream, setShowNewDream] = useState(false);

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("id, title, dream_text, emotional_theme, image_url, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setDreams(data);
    setLoading(false);
  };

  const handleDreamCreated = (dreamId: string) => {
    setShowNewDream(false);
    setSelectedDreamId(dreamId);
    fetchDreams();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? "In the depths of night..." :
    hour < 12 ? "Good morning, dreamer" :
    hour < 17 ? "Welcome back" :
    hour < 21 ? "As the evening falls..." :
    "In the quiet of night...";

  return (
    <div className="min-h-screen bg-gradient-void">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-dream-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-dream-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-2/3 left-2/3 w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-dream-float" style={{ animationDelay: "6s" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8 min-h-screen">
          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-foreground text-lg leading-tight">
                  Dream Journal
                </h1>
                <p className="text-xs text-muted-foreground font-body">Subconscious explorer</p>
              </div>
            </div>

            {/* New Dream button */}
            <Button
              onClick={() => setShowNewDream(true)}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New Dream Entry
            </Button>

            {/* Stats */}
            <div className="bg-dream-card rounded-2xl p-4 nebula-border space-y-3">
              <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider">
                Your Dream Archive
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="font-display text-2xl font-semibold text-dream-glow">
                    {dreams.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-body">Dreams</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-semibold text-accent">
                    {dreams.filter(d => d.image_url).length}
                  </div>
                  <div className="text-xs text-muted-foreground font-body">Visualized</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Stars className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-body font-medium text-primary">Dream tip</span>
              </div>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                Record your dream immediately upon waking — even partial fragments. 
                The more detail you capture, the richer the analysis.
              </p>
            </div>

            {/* Recent entries list */}
            {dreams.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Recent Entries
                </h3>
                <div className="space-y-1">
                  {dreams.slice(0, 8).map((dream) => (
                    <button
                      key={dream.id}
                      onClick={() => setSelectedDreamId(dream.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-body transition-all ${
                        selectedDreamId === dream.id
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium truncate">{dream.title}</div>
                      <div className="text-muted-foreground/60 mt-0.5">
                        {new Date(dream.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-0">
            {selectedDreamId ? (
              <DreamView
                dreamId={selectedDreamId}
                onBack={() => setSelectedDreamId(null)}
              />
            ) : (
              <div className="flex-1 space-y-8 animate-dream-in">
                {/* Greeting */}
                <div className="space-y-1 pt-2">
                  <h2 className="font-display text-4xl font-semibold">
                    <span className="text-foreground">{greeting}</span>
                  </h2>
                  <p className="text-muted-foreground font-body">
                    {dreams.length === 0
                      ? "Begin your journey into the unconscious"
                      : `You've recorded ${dreams.length} dream${dreams.length !== 1 ? "s" : ""}. What did you dream last night?`}
                  </p>
                </div>

                {/* Dream grid */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : dreams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center pulse-glow">
                        <Moon className="w-10 h-10 text-primary float" />
                      </div>
                      <Sparkles className="w-5 h-5 text-accent absolute -top-1 -right-1 animate-dream-float" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-display text-xl text-foreground">Your dream journal awaits</h3>
                      <p className="text-muted-foreground font-body text-sm max-w-xs">
                        Record your first dream to begin exploring the language of your unconscious mind
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowNewDream(true)}
                      className="gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 py-5 font-body font-medium shadow-dream"
                    >
                      <Mic className="w-4 h-4" />
                      Record First Dream
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dreams.map((dream, i) => (
                      <DreamCard
                        key={dream.id}
                        dream={dream}
                        onClick={() => setSelectedDreamId(dream.id)}
                        delay={i * 80}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* New Dream Modal */}
      {showNewDream && (
        <NewDreamModal
          onClose={() => setShowNewDream(false)}
          onDreamCreated={handleDreamCreated}
        />
      )}
    </div>
  );
};

export default Index;
