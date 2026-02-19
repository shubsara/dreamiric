import { useState, useEffect } from "react";
import { Moon, Download, Smartphone, Share, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-void flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-dream-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-dream-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 max-w-sm w-full text-center space-y-8 animate-dream-in">
        {/* App icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center pulse-glow shadow-dream">
            <Moon className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground">Oneiric</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Dream Journal & Soul Analysis</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-dream-card rounded-2xl p-5 nebula-border space-y-3 text-left">
          {[
            { icon: Moon, text: "Record & analyze your dreams" },
            { icon: Sparkles, text: "Jungian psychological insights" },
            { icon: Smartphone, text: "Works offline, like a native app" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-body text-foreground/80">{text}</span>
            </div>
          ))}
        </div>

        {/* Install instructions */}
        {installed ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
              <p className="text-primary font-body font-medium text-sm">✓ App installed successfully!</p>
              <p className="text-muted-foreground text-xs mt-1">Open Oneiric from your home screen</p>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream"
            >
              Open Dream Journal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-3">
            <Button
              onClick={handleInstall}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream"
            >
              <Download className="w-4 h-4" />
              Install App
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full text-muted-foreground font-body text-sm"
            >
              Continue in browser
            </Button>
          </div>
        ) : isIOS ? (
          <div className="space-y-4">
            <div className="bg-dream-card rounded-2xl p-5 nebula-border text-left space-y-3">
              <p className="text-sm font-body font-medium text-foreground">Install on iPhone / iPad:</p>
              <div className="space-y-2 text-sm text-muted-foreground font-body">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>Tap the <Share className="inline w-4 h-4 text-primary" /> Share button in Safari</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>Tap <strong className="text-foreground">"Add"</strong> to confirm</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream"
            >
              Open Dream Journal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : isAndroid ? (
          <div className="space-y-4">
            <div className="bg-dream-card rounded-2xl p-5 nebula-border text-left space-y-3">
              <p className="text-sm font-body font-medium text-foreground">Install on Android:</p>
              <div className="space-y-2 text-sm text-muted-foreground font-body">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>Tap the <strong className="text-foreground">⋮ menu</strong> in Chrome</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>Tap <strong className="text-foreground">"Add to Home screen"</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>Tap <strong className="text-foreground">"Add"</strong> to confirm</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream"
            >
              Open Dream Journal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-dream-card rounded-2xl p-4 nebula-border">
              <div className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                <Plus className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Open this page on your phone and tap <strong className="text-foreground">"Add to Home Screen"</strong> from your browser menu.</span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream"
            >
              Open Dream Journal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
