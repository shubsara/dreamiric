import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, CheckCircle, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(40).fill(3));
  const [micDenied, setMicDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const animateWaveform = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: 40 }, (_, i) => {
        const idx = Math.floor((i / 40) * dataArray.length);
        return Math.max(3, (dataArray[idx] / 255) * 48);
      });
      setWaveform(bars);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setWaveform(Array(40).fill(3));
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setHasRecording(false);
      setAudioUrl(null);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      animateWaveform(analyser);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setMicDenied(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    setHasRecording(false);
    setAudioUrl(null);
    setDuration(0);
    setWaveform(Array(40).fill(3));
    blobRef.current = null;
  };

  const confirmRecording = () => {
    if (blobRef.current) {
      onRecordingComplete(blobRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (micDenied) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <MicOff className="w-7 h-7 text-destructive" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Microphone Access Denied</h3>
        <p className="text-sm text-muted-foreground font-body max-w-xs leading-relaxed">
          To record your dream by voice, please enable microphone access in your browser settings:
        </p>
        <ol className="text-xs text-muted-foreground font-body text-left space-y-1.5 list-decimal list-inside">
          <li>Click the lock/info icon in the address bar</li>
          <li>Find <strong>Microphone</strong> and set it to <strong>Allow</strong></li>
          <li>Reload the page and try again</li>
        </ol>
        <Button
          variant="outline"
          onClick={() => setMicDenied(false)}
          className="mt-2 rounded-full font-body"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform visualizer */}
      <div className="w-full h-16 flex items-center justify-center gap-[2px] px-4">
        {waveform.map((h, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 rounded-full transition-all duration-75",
              isRecording ? "bg-dream-glow" : hasRecording ? "bg-accent" : "bg-muted"
            )}
            style={{ height: `${h}px`, opacity: isRecording ? 0.7 + (h / 48) * 0.3 : 0.4 }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="font-display text-3xl font-medium text-foreground tabular-nums">
        {formatTime(duration)}
      </div>

      {/* Controls */}
      {!hasRecording ? (
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                "bg-destructive hover:bg-destructive/90 transition-all duration-200",
                "shadow-lg shadow-destructive/30 hover:scale-105",
                "border-4 border-destructive/50"
              )}
            >
              <Mic className="w-8 h-8 text-destructive-foreground" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-destructive animate-record-pulse border-4 border-destructive/50"
            >
              <Square className="w-7 h-7 text-destructive-foreground fill-current" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <audio
            ref={audioRef}
            src={audioUrl || ""}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-muted-foreground font-body">
              Recording ready — {formatTime(duration)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={discardRecording}
              className="w-10 h-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={confirmRecording}
            className="gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-full px-8 font-body font-medium transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Use This Recording
          </Button>
        </div>
      )}

      {isRecording && (
        <p className="text-sm text-muted-foreground font-body animate-pulse">
          Recording your dream... speak naturally
        </p>
      )}

      {!isRecording && !hasRecording && (
        <p className="text-xs text-muted-foreground/70 font-body text-center max-w-[260px] leading-relaxed">
          💡 Tip: Use a quiet environment for best transcription quality
        </p>
      )}
    </div>
  );
}
