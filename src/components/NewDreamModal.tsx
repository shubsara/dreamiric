import { useState } from "react";
import { Mic, PenLine, X, Loader2, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewDreamModalProps {
  onClose: () => void;
  onDreamCreated: (dreamId: string) => void;
}

type InputMode = "voice" | "text";
type Stage = "input" | "transcribing" | "analyzing";

const ANALYSIS_LANGUAGES = [
  { value: "dream", label: "Same as dream" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Italian", label: "Italiano" },
  { value: "Portuguese", label: "Português" },
  { value: "Dutch", label: "Nederlands" },
  { value: "Russian", label: "Русский" },
  { value: "Japanese", label: "日本語" },
  { value: "Korean", label: "한국어" },
  { value: "Chinese", label: "中文" },
  { value: "Arabic", label: "العربية" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "Turkish", label: "Türkçe" },
  { value: "Polish", label: "Polski" },
  { value: "Swedish", label: "Svenska" },
];

export function NewDreamModal({ onClose, onDreamCreated }: NewDreamModalProps) {
  const [mode, setMode] = useState<InputMode>("voice");
  const [stage, setStage] = useState<Stage>("input");
  const [textInput, setTextInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [analysisLanguage, setAnalysisLanguage] = useState("dream");
  const { toast } = useToast();
  const { user } = useAuth();

  const processAudio = async (blob: Blob) => {
    setStage("transcribing");
    setStatusMessage("Listening to your dream...");

    try {
      const formData = new FormData();
      formData.append("audio", blob, "dream.webm");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

      const transcribeResp = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-dream`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!transcribeResp.ok) throw new Error("Transcription failed");
      const { transcript } = await transcribeResp.json();

      if (!transcript?.trim()) throw new Error("Could not transcribe audio. Please try again or use text mode.");

      await analyzeDream(transcript);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
      setStage("input");
    }
  };

  const processText = async () => {
    if (!textInput.trim()) return;
    await analyzeDream(textInput.trim());
  };

  const analyzeDream = async (dreamText: string) => {
    setStage("analyzing");
    setStatusMessage("Creating your dream entry...");

    try {
      const { data: dream, error: createError } = await supabase
        .from("dreams")
        .insert({ dream_text: dreamText, raw_transcript: dreamText, user_id: user!.id })
        .select()
        .single();

      if (createError) throw createError;

      setStatusMessage("Painting your dreamscape...");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

      const analyzeResp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-dream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dreamText, dreamId: dream.id, analysisLanguage }),
      });

      if (!analyzeResp.ok) {
        const err = await analyzeResp.json();
        throw new Error(err.error || "Analysis failed");
      }

      onDreamCreated(dream.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
      setStage("input");
    }
  };

  const isProcessing = stage !== "input";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-strong rounded-3xl p-8 shadow-dream animate-dream-in">
        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {isProcessing ? "Weaving Your Dream" : "Capture a Dream"}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {isProcessing ? statusMessage : "While it's still fresh in your mind"}
          </p>
        </div>

        {/* Processing state */}
        {isProcessing ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            </div>
            <div className="space-y-2 text-center">
              {stage === "transcribing" && (
                <p className="text-sm text-muted-foreground font-body">Transcribing your voice...</p>
              )}
              {stage === "analyzing" && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-body">Analyzing archetypes & symbols</p>
                  <p className="text-xs text-muted-foreground/60 font-body">Generating surrealist imagery...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mode switcher */}
            <div className="flex rounded-xl overflow-hidden border border-border mb-6 bg-muted p-1 gap-1">
              <button
                onClick={() => setMode("voice")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium transition-all",
                  mode === "voice"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Mic className="w-4 h-4" />
                Voice
              </button>
              <button
                onClick={() => setMode("text")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium transition-all",
                  mode === "text"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <PenLine className="w-4 h-4" />
                Write
              </button>
            </div>

            {/* Voice mode */}
            {mode === "voice" && (
              <VoiceRecorder onRecordingComplete={processAudio} />
            )}

            {/* Text mode */}
            {mode === "text" && (
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Describe your dream in any language... The setting, the people, the feelings, the strange details that don't quite make sense..."
                className="min-h-40 bg-input border-border text-foreground placeholder:text-muted-foreground resize-none font-body text-sm leading-relaxed focus:border-primary/50 rounded-xl"
                autoFocus
              />
            )}

            {/* Analysis language selector */}
            <div className="mt-5 pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">Analysis language</span>
              </div>
              <Select value={analysisLanguage} onValueChange={setAnalysisLanguage}>
                <SelectTrigger className="w-full bg-input border-border text-sm font-body rounded-xl h-10 focus:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {ANALYSIS_LANGUAGES.map(({ value, label }) => (
                    <SelectItem key={value} value={value} className="font-body text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit button (text mode only) */}
            {mode === "text" && (
              <Button
                onClick={processText}
                disabled={!textInput.trim()}
                className="w-full mt-4 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-6 font-body font-medium gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Analyze This Dream
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
