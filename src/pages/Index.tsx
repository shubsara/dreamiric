import { useState, useEffect } from "react";
import { Plus, Moon, BookOpen, Sparkles, Stars, Mic, TrendingUp, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreamCard } from "@/components/DreamCard";
import { DreamView } from "@/components/DreamView";
import { NewDreamModal } from "@/components/NewDreamModal";
import { DreamPatterns } from "@/components/DreamPatterns";
import { NotificationToggle } from "@/components/NotificationToggle";
import { UsageTracker } from "@/components/UsageTracker";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { ProBadge } from "@/components/ProBadge";
import { ManageSubscription } from "@/components/ManageSubscription";
import { RetentionBanner } from "@/components/RetentionBanner";
import { DreamStreak } from "@/components/DreamStreak";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 10;

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  image_url: string | null;
  created_at: string;
}

type View = "journal" | "patterns";

const PATTERN_PREVIEW_KEY = "dream_pattern_preview_seen";

const Index = () => {
  const { user, signOut } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [showNewDream, setShowNewDream] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeView, setActiveView] = useState<View>("journal");
  const { isPro: isSubscribed } = useSubscription();
  const isAtLimit = !isSubscribed && dreams.length >= FREE_LIMIT;

  // Free users get a one-time pattern preview at 7+ dreams
  const [hasSeenPreview, setHasSeenPreview] = useState(() =>
    localStorage.getItem(PATTERN_PREVIEW_KEY) === "true"
  );
  const [previewActive, setPreviewActive] = useState(false);
  const canPreviewPatterns = !isSubscribed && dreams.length >= 7 && !hasSeenPreview;

  const handlePatternsClick = (id: View) => {
    if (id === "patterns" && canPreviewPatterns) {
      localStorage.setItem(PATTERN_PREVIEW_KEY, "true");
      setHasSeenPreview(true);
      setPreviewActive(true);
    }
    setActiveView(id);
    setSelectedDreamId(null);
  };

  const showPatterns = isSubscribed || previewActive;

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
    setActiveView("journal");
    fetchDreams();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? "In the depths of night..." :
    hour < 12 ? "Good morning, dreamer" :
    hour < 17 ? "Welcome back" :
    hour < 21 ? "As the evening falls..." :
    "In the quiet of night...";

  const navItems: Array<{ id: View; label: string; icon: typeof Moon }> = [
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "patterns", label: "Patterns", icon: TrendingUp },
  ];

  // When a dream is selected on mobile, show full-screen dream view
  const showMobileDreamView = selectedDreamId !== null;

  return (
    <div className="min-h-screen bg-gradient-void">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-dream-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-dream-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-2/3 left-2/3 w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-dream-float" style={{ animationDelay: "6s" }} />
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block relative max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8 min-h-screen">
          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-semibold text-foreground text-lg leading-tight">
                    Dream Journal
                  </h1>
                  {isSubscribed && <ProBadge />}
                </div>
                <p className="text-xs text-muted-foreground font-body truncate">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* New Dream button */}
            <Button
              onClick={() => isAtLimit ? setShowSubscription(true) : setShowNewDream(true)}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New Dream Entry
            </Button>

            {/* Nav */}
            <div className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handlePatternsClick(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all",
                    activeView === id && !selectedDreamId
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === "patterns" && canPreviewPatterns && (
                    <span className="ml-auto text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">Preview</span>
                  )}
                </button>
              ))}
            </div>

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

            {/* Streak counter */}
            <DreamStreak dreamDates={dreams.map(d => d.created_at)} />

            {/* Usage tracker or subscription management */}
            {isSubscribed ? (
              <ManageSubscription />
            ) : (
              <UsageTracker
                dreamCount={dreams.length}
                isSubscribed={isSubscribed}
                onUpgrade={() => setShowSubscription(true)}
              />
            )}

            {/* Retention banner */}
            <RetentionBanner
              dreamCount={dreams.length}
              lastDreamDate={dreams[0]?.created_at ?? null}
              onNewDream={() => isAtLimit ? setShowSubscription(true) : setShowNewDream(true)}
            />

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

            {/* Morning reminders */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider px-1">Reminders</p>
              <NotificationToggle />
            </div>

            {/* Recent entries list – only in journal view */}
            {activeView === "journal" && dreams.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Recent Entries
                </h3>
                <div className="space-y-1">
                  {dreams.slice(0, 8).map((dream) => (
                    <button
                      key={dream.id}
                      onClick={() => {
                        setSelectedDreamId(dream.id);
                        setActiveView("journal");
                      }}
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
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeView === "patterns" ? (
              showPatterns ? (
                <div className="space-y-4 animate-dream-in">
                  {!isSubscribed && (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-body text-accent">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span>One-time preview — upgrade to Pro for ongoing access</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowSubscription(true)}
                        className="bg-dream-primary hover:opacity-90 text-primary-foreground rounded-lg font-body text-xs px-3"
                      >
                        Upgrade
                      </Button>
                    </div>
                  )}
                  <DreamPatterns />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-dream-in">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-9 h-9 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-display text-xl text-foreground">
                      {!isSubscribed && dreams.length < 7
                        ? `Record ${7 - dreams.length} more dream${7 - dreams.length !== 1 ? "s" : ""} to unlock a free preview`
                        : "Upgrade to Pro"}
                    </h3>
                    <p className="text-muted-foreground font-body text-sm max-w-xs">
                      {!isSubscribed && dreams.length < 7
                        ? "At 7 dreams you'll get a one-time pattern analysis preview."
                        : hasSeenPreview
                          ? "You've used your free preview. Upgrade to Pro for full access."
                          : "Upgrade to Pro to get your Pattern of your Dreams."}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowSubscription(true)}
                    className="gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 py-5 font-body font-medium shadow-dream"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Pro
                  </Button>
                </div>
              )
            ) : selectedDreamId ? (
              <DreamView
                dreamId={selectedDreamId}
                onBack={() => setSelectedDreamId(null)}
              />
            ) : (
              <DesktopJournalGrid
                greeting={greeting}
                dreams={dreams}
                loading={loading}
                onSelectDream={setSelectedDreamId}
                onNewDream={() => setShowNewDream(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile: full-screen dream view */}
        {showMobileDreamView ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile dream view header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              <button
                onClick={() => setSelectedDreamId(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <DreamView
                dreamId={selectedDreamId!}
                onBack={() => setSelectedDreamId(null)}
                hideMobileBackButton
              />
            </div>
          </div>
        ) : (
          <>
            {/* Mobile top header */}
            <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Moon className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-display font-semibold text-foreground flex-1">
                Dream Journal
                {isSubscribed && <ProBadge className="ml-2 align-middle" />}
              </h1>
              <button
                onClick={signOut}
                title="Sign out"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </header>

            {/* Mobile main content */}
            <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
              {/* Mobile usage tracker */}
              <div className="mb-4">
                <UsageTracker
                  dreamCount={dreams.length}
                  isSubscribed={isSubscribed}
                  onUpgrade={() => setShowSubscription(true)}
                  compact
                />
              </div>
              {/* Mobile retention banner */}
              <div className="mb-4">
                <RetentionBanner
                  dreamCount={dreams.length}
                  lastDreamDate={dreams[0]?.created_at ?? null}
                  onNewDream={() => isAtLimit ? setShowSubscription(true) : setShowNewDream(true)}
                />
              </div>
              {/* Mobile streak counter */}
              <div className="mb-4">
                <DreamStreak dreamDates={dreams.map(d => d.created_at)} />
              </div>
              {activeView === "patterns" ? (
                showPatterns ? (
                  <div className="space-y-3 animate-dream-in">
                    {!isSubscribed && (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-accent/10 border border-accent/20 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-xs font-body text-accent">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>One-time preview</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowSubscription(true)}
                          className="bg-dream-primary hover:opacity-90 text-primary-foreground rounded-lg font-body text-xs px-3 h-7"
                        >
                          Upgrade
                        </Button>
                      </div>
                    )}
                    <DreamPatterns />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-display text-lg text-foreground">
                        {!isSubscribed && dreams.length < 7
                          ? `Record ${7 - dreams.length} more dream${7 - dreams.length !== 1 ? "s" : ""} to unlock a free preview`
                          : "Upgrade to Pro"}
                      </h3>
                      <p className="text-muted-foreground font-body text-sm max-w-xs">
                        {!isSubscribed && dreams.length < 7
                          ? "At 7 dreams you'll get a one-time pattern analysis preview."
                          : hasSeenPreview
                            ? "You've used your free preview. Upgrade to Pro for full access."
                            : "Upgrade to Pro to get your Pattern of your Dreams."}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowSubscription(true)}
                      className="gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 py-5 font-body font-medium shadow-dream"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Pro
                    </Button>
                  </div>
                )
              ) : (
                <MobileJournalView
                  greeting={greeting}
                  dreams={dreams}
                  loading={loading}
                  onSelectDream={(id) => {
                    setSelectedDreamId(id);
                    setActiveView("journal");
                  }}
                />
              )}
            </main>

            {/* Mobile bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/30 bg-background/90 backdrop-blur-md" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex items-center">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handlePatternsClick(id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-body font-medium transition-all",
                      activeView === id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex items-center gap-1">
                      {label}
                      {id === "patterns" && canPreviewPatterns && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </span>
                  </button>
                ))}

                {/* FAB in center */}
                <button
                  onClick={() => isAtLimit ? setShowSubscription(true) : setShowNewDream(true)}
                  className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-dream-primary shadow-dream flex items-center justify-center text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* New Dream Modal */}
      {showNewDream && (
        <NewDreamModal
          onClose={() => setShowNewDream(false)}
          onDreamCreated={handleDreamCreated}
        />
      )}

      {/* Subscription Modal */}
      {showSubscription && (
        <SubscriptionModal
          dreamCount={dreams.length}
          onClose={() => setShowSubscription(false)}
          onSubscribe={(plan) => {
            // Stripe payment will be wired here
            setShowSubscription(false);
          }}
        />
      )}
    </div>
  );
};

// ── Sub-components ──

function DesktopJournalGrid({
  greeting, dreams, loading, onSelectDream, onNewDream
}: {
  greeting: string;
  dreams: Dream[];
  loading: boolean;
  onSelectDream: (id: string) => void;
  onNewDream: () => void;
}) {
  return (
    <div className="flex-1 space-y-8 animate-dream-in">
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
            onClick={onNewDream}
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
              onClick={() => onSelectDream(dream.id)}
              delay={i * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileJournalView({
  greeting, dreams, loading, onSelectDream
}: {
  greeting: string;
  dreams: Dream[];
  loading: boolean;
  onSelectDream: (id: string) => void;
}) {
  return (
    <div className="space-y-5 animate-dream-in">
      <div className="space-y-1 pt-1">
        <h2 className="font-display text-2xl font-semibold text-foreground">{greeting}</h2>
        <p className="text-muted-foreground font-body text-sm">
          {dreams.length === 0
            ? "Begin your journey into the unconscious"
            : `${dreams.length} dream${dreams.length !== 1 ? "s" : ""} recorded`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : dreams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center pulse-glow">
              <Moon className="w-9 h-9 text-primary float" />
            </div>
            <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-dream-float" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-display text-lg text-foreground">Your dream journal awaits</h3>
            <p className="text-muted-foreground font-body text-sm max-w-xs">
              Tap the + button below to record your first dream
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dreams.map((dream, i) => (
            <DreamCard
              key={dream.id}
              dream={dream}
              onClick={() => onSelectDream(dream.id)}
              delay={i * 60}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Index;
