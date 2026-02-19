import { useState } from "react";
import { Mic, PenLine, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewDreamModalProps {
  onClose: () => void;
  onDreamCreated: (dreamId: string) => void;
}

type InputMode = "voice" | "text";
type Stage = "input" | "transcribing" | "analyzing";

export function NewDreamModal({ onClose, onDreamCreated }: NewDreamModalProps) {
  const [mode, setMode] = useState<InputMode>("voice");
  const [stage, setStage] = useState<Stage>("input");
  const [textInput, setTextInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const { toast } = useToast();

  const processAudio = async (blob: Blob) => {
    setStage("transcribing");
    setStatusMessage("Listening to your dream...");

    try {
      const formData = new FormData();
      formData.append("audio", blob, "dream.webm");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const transcribeResp = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-dream`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PUBLISHABLE_KEY}` },
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
      // Create dream record first
      const { data: dream, error: createError } = await supabase
        .from("dreams")
        .insert({ dream_text: dreamText, raw_transcript: dreamText })
        .select()
        .single();

      if (createError) throw createError;

      setStatusMessage("Painting your dreamscape...");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const analyzeResp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-dream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ dreamText, dreamId: dream.id }),
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
              <div className="space-y-4">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe your dream in as much detail as you can remember... The setting, the people, the feelings, the strange details that don't quite make sense..."
                  className="min-h-40 bg-input border-border text-foreground placeholder:text-muted-foreground resize-none font-body text-sm leading-relaxed focus:border-primary/50 rounded-xl"
                  autoFocus
                />
                <Button
                  onClick={processText}
                  disabled={!textInput.trim()}
                  className="w-full bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-6 font-body font-medium gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze This Dream
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
