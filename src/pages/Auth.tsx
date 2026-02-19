import { useState } from "react";
import { Moon, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Check your email 📬",
          description: "We've sent you a confirmation link to activate your account.",
        });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change will handle redirect
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setForgotSent(true);
      }
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-void flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-dream-float" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-dream-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-dream-in">
        {/* Logo */}
        <div className="text-center mb-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto pulse-glow shadow-dream">
            <Moon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Oneiric</h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Your private dream journal</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-dream nebula-border">
          {/* Mode tabs */}
          {mode !== "forgot" && (
            <div className="flex rounded-xl overflow-hidden border border-border bg-muted p-1 gap-1 mb-6">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all capitalize",
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password — sent state */}
          {mode === "forgot" && forgotSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Check your inbox</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  We sent a reset link to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              <button
                onClick={() => { setMode("login"); setForgotSent(false); }}
                className="text-sm text-primary font-body hover:opacity-80 transition-opacity"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "forgot" && (
                <div className="text-center mb-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">Reset password</h2>
                  <p className="text-xs text-muted-foreground font-body mt-1">Enter your email and we'll send a link</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-xl font-body focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Password (not in forgot mode) */}
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="pl-9 pr-9 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-xl font-body focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary font-body hover:opacity-80 transition-opacity"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <p className="text-xs text-muted-foreground font-body">
                  Password must be at least 6 characters. You'll receive a confirmation email.
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 font-body font-medium shadow-dream transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === "login" ? (
                  <><ArrowRight className="w-4 h-4" /> Enter your journal</>
                ) : mode === "signup" ? (
                  <><Sparkles className="w-4 h-4" /> Begin your journey</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send reset link</>
                )}
              </Button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Your dreams are private and encrypted — only you can see them.
        </p>
      </div>
    </div>
  );
}
