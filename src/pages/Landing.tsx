import { useEffect } from "react";
import { Moon, Sparkles, Brain, TrendingUp, Mic, Shield, ArrowRight, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const JSON_LD_ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dreamiric",
  url: "https://dreamiric.lovable.app",
  logo: "https://dreamiric.lovable.app/pwa-icon-512.png",
  description: "AI-powered dream journal with Jungian depth analysis.",
  sameAs: [],
};

const JSON_LD_APP = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dreamiric",
  url: "https://dreamiric.lovable.app",
  applicationCategory: "HealthApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "Record dreams via text or voice. Get Jungian depth analysis, uncover archetypes, and discover recurring patterns in your subconscious.",
  featureList: [
    "Voice-to-dream transcription",
    "Jungian depth analysis",
    "Recurring pattern discovery",
    "Private & encrypted",
  ],
  screenshot: "https://dreamiric.lovable.app/og-image.png",
};

const FEATURES = [
  {
    icon: Brain,
    title: "Jungian Depth Analysis",
    description: "Our AI interprets symbols, archetypes, and emotional themes rooted in depth psychology.",
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Mic,
    title: "Voice-to-Dream",
    description: "Speak your dream right after waking — our transcription captures every detail before it fades.",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: TrendingUp,
    title: "Pattern Discovery",
    description: "Recurring symbols, emotional arcs, and hidden connections emerge as your journal grows.",
    gradient: "from-primary/15 to-accent/10",
    iconColor: "text-primary",
  },
  {
    icon: Shield,
    title: "Private & Encrypted",
    description: "Your dreams are yours alone. End-to-end privacy ensures no one else can read them.",
    gradient: "from-muted to-secondary/50",
    iconColor: "text-foreground",
  },
];

const STEPS = [
  { step: "01", title: "Record", description: "Type or speak your dream the moment you wake up." },
  { step: "02", title: "Analyse", description: "AI uncovers archetypes, symbols, and emotional undertones." },
  { step: "03", title: "Discover", description: "Track recurring patterns and deepen self-understanding." },
];

const TESTIMONIALS = [
  { name: "Anya R.", text: "I never realised how often water appeared in my dreams until Dreamiric showed me. Now I understand my anxiety patterns.", stars: 5 },
  { name: "Marcus L.", text: "The voice recording feature is a game-changer. I capture so much more detail right after waking.", stars: 5 },
  { name: "Priya K.", text: "Beautiful app. The Jungian analysis feels thoughtful and insightful, not generic.", stars: 5 },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const orgScript = document.createElement("script");
    orgScript.type = "application/ld+json";
    orgScript.text = JSON.stringify(JSON_LD_ORG);
    orgScript.id = "ld-org";

    const appScript = document.createElement("script");
    appScript.type = "application/ld+json";
    appScript.text = JSON.stringify(JSON_LD_APP);
    appScript.id = "ld-app";

    document.head.appendChild(orgScript);
    document.head.appendChild(appScript);

    return () => {
      document.getElementById("ld-org")?.remove();
      document.getElementById("ld-app")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]" />
        <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px]" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Moon className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground tracking-tight">Dreamiric</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="font-body text-sm text-muted-foreground hover:text-foreground"
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-body text-sm rounded-xl px-5"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-dream-in">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-body font-medium text-primary">AI-Powered Dream Journal</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 animate-dream-in" style={{ animationDelay: "100ms" }}>
          Decode Your
          <br />
          <span className="text-dream">Subconscious Mind</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground font-body leading-relaxed mb-10 animate-dream-in" style={{ animationDelay: "200ms" }}>
          Record your dreams through text or voice, receive Jungian depth analysis, and uncover recurring patterns that reveal who you truly are.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-dream-in" style={{ animationDelay: "300ms" }}>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 py-6 font-body font-semibold text-base shadow-dream transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Start Your Journal — Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-body">No credit card required</span>
        </div>

        {/* Hero visual — floating moon card */}
        <div className="relative mt-16 md:mt-20 mx-auto max-w-3xl animate-dream-in" style={{ animationDelay: "400ms" }}>
          <div className="rounded-3xl bg-card/80 border border-border/50 backdrop-blur-xl p-6 md:p-10 shadow-card">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 pulse-glow">
                <Moon className="w-8 h-8 md:w-10 md:h-10 text-primary float" />
              </div>
              <div className="text-left space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">Last night's dream</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-accent/15 text-accent border border-accent/25">Anxiety</span>
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed italic">
                  "I was in a vast library where the books kept rearranging themselves. Every time I found the right shelf, the book I needed had moved…"
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Library", "Searching", "Transformation"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg text-[11px] font-body font-medium bg-secondary text-secondary-foreground border border-border/50">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Everything Your Dreams Need
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            From capture to insight — a complete toolkit for understanding your inner world.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={cn(
                "group rounded-2xl p-6 space-y-4 border border-border/40 bg-card/50 backdrop-blur-sm",
                "hover:border-primary/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1",
                "animate-dream-in"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br", f.gradient)}>
                <f.icon className={cn("w-5 h-5", f.iconColor)} />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Three Steps to Self-Discovery
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            A simple ritual that grows deeper with every entry.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative text-center space-y-4 animate-dream-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="font-display text-5xl font-bold text-primary/15">{s.step}</div>
              <h3 className="font-display text-xl font-semibold text-foreground -mt-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.description}</p>
              {i < STEPS.length - 1 && (
                <ChevronRight className="hidden md:block absolute top-8 -right-6 w-5 h-5 text-primary/20" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Dreamers Love It
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm p-6 space-y-4 animate-dream-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed italic">"{t.text}"</p>
              <p className="text-xs font-body font-semibold text-foreground">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/15 p-10 md:p-16 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto pulse-glow">
            <Moon className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground">
            Begin Decoding Your Dreams Tonight
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Join thousands of dreamers uncovering the hidden language of their subconscious. Free to start, no credit card needed.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-10 py-6 font-body font-semibold text-base shadow-dream transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Start Free Journal
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/30 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">Dreamiric</span>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Dreamiric. Your dreams, your insights, your privacy.
          </p>
        </div>
      </footer>
    </div>
  );
}
