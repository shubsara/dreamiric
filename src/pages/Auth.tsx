import { useState } from "react";
import { Moon, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

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

          {/* Google Sign-In */}
          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                variant="outline"
                className="w-full gap-3 rounded-xl py-5 font-body font-medium border-border bg-muted/50 hover:bg-muted text-foreground transition-all"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-body">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
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
