"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSpeakingStore, EvaluationReport, HistoryItem } from "@/store/useSpeakingStore";
import { Radio, Square, XCircle, AlertCircle } from "lucide-react";

interface ExtendedMediaRecorderResponse {
  mimeType: string;
}

interface AudioContextType {
  new (options?: AudioContextOptions): AudioContext;
  prototype: AudioContext;
}

export default function RecordView() {
  const {
    selectedTopic,
    targetLanguage,
    speakingTimeLeft,
    isRecording,
    decrementSpeaking,
    stopRecording,
    cancelSession,
    setEvaluation,
    addToHistory,
    setErrorMessage
  } = useSpeakingStore();

  const [micBlocked, setMicBlocked] = useState(false);
  const [micStreaming, setMicStreaming] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Audio references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Process and transmit recorded audio payload
  const processRecordedAudio = useCallback(async () => {
    try {
      const mimeType = (mediaRecorderRef.current as unknown as ExtendedMediaRecorderResponse)?.mimeType || "audio/webm";
      const audioBlob = audioChunksRef.current.length > 0 
        ? new Blob(audioChunksRef.current, { type: mimeType })
        : new Blob([], { type: "audio/webm" }); // Fallback empty blob if mic is blocked

      const elapsedSeconds = Math.round(((Date.now() - recordingStartTimeRef.current) / 1000) * 10) / 10;

      // Pack files into payload form
      const payload = new FormData();
      payload.append("audio", audioBlob, "speech.webm");
      payload.append("topic", selectedTopic?.title || "");
      payload.append("targetLanguage", targetLanguage);
      payload.append("durationSeconds", elapsedSeconds.toString());

      // API request to evaluate route
      const response = await fetch("/api/evaluate-speech", {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        throw new Error("Speech evaluation network request failed. Please check your connection.");
      }

      const evaluation = await response.json() as EvaluationReport;
      
      // Save results to global store
      setEvaluation(evaluation);

      // Add record to evaluation history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString(),
        topic: selectedTopic?.title || "",
        category: selectedTopic?.category || "Intermediate",
        targetLanguage,
        audioDuration: elapsedSeconds,
        evaluation
      };
      addToHistory(historyItem);

    } catch (err: unknown) {
      console.error("Evaluation error: ", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during transcription / evaluation. Please try again.";
      setErrorMessage(message);
      cancelSession();
    }
  }, [selectedTopic, targetLanguage, setEvaluation, addToHistory, setErrorMessage, cancelSession]);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
  }, []);

  // Submit audio and stop recording
  const handleStopAndSubmit = useCallback(() => {
    const elapsedSeconds = (Date.now() - recordingStartTimeRef.current) / 1000;
    
    // Warn user if recording duration is under 10 seconds
    if (elapsedSeconds < 10) {
      setWarningMessage("Recording too short to evaluate. Please speak for at least 10 seconds before submitting.");
      setTimeout(() => setWarningMessage(null), 5000);
      return;
    }

    const hasActiveRecorder = mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive";

    cleanupAudio();
    stopRecording(); // changes flowState to ANALYZING

    if (hasActiveRecorder) {
      mediaRecorderRef.current?.stop();
    } else {
      // Direct fallback evaluation trigger if microphone was blocked/unsupported (e.g. headless browser)
      processRecordedAudio();
    }
  }, [stopRecording, cleanupAudio, processRecordedAudio]);

  // Initialize recording countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && speakingTimeLeft > 0) {
      timer = setInterval(() => {
        decrementSpeaking();
      }, 1000);
    } else if (speakingTimeLeft === 0 && isRecording) {
      // Auto submit when countdown reaches 00:00
      handleStopAndSubmit();
    }
    return () => clearInterval(timer);
  }, [isRecording, speakingTimeLeft, decrementSpeaking, handleStopAndSubmit]);

  // Setup real-time visualizer canvas using Web Audio API
  const setupVisualizer = (stream: MediaStream) => {
    try {
      const AudioContextClass = (window.AudioContext || (window as unknown as { webkitAudioContext: AudioContextType }).webkitAudioContext) as unknown as AudioContextType;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // Render dynamic frequency bars
        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 1.5;
          
          // Emerald to Violet gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "#10B981"); // emerald
          gradient.addColorStop(1, "#8B5CF6"); // violet

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.error("Could not start waveform visualizer:", e);
    }
  };

  // Request Mic & Start Capturing
  useEffect(() => {
    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setMicBlocked(false);
        setMicStreaming(true);

        // Standard MediaRecorder instantiation
        let options = { mimeType: "audio/webm" };
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          // Fallback to wav/mp4/ogg defaults if webm is not supported (e.g. Safari)
          options = { mimeType: "" };
        }
        
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Process payload after recording stops
          await processRecordedAudio();
        };

        // Start Recording
        mediaRecorder.start(200); // chunk every 200ms
        recordingStartTimeRef.current = Date.now();

        // Setup real-time visualizer canvas using Web Audio API
        setupVisualizer(stream);

      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setMicBlocked(true);
        setMicStreaming(false);
        setErrorMessage("Microphone access is blocked or missing. Please enable microphone permissions in your browser to speak.");
      }
    }

    if (isRecording) {
      recordingStartTimeRef.current = Date.now(); // Set startTime even if mic is blocked for headless runs
      initAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [isRecording, processRecordedAudio, setErrorMessage, cleanupAudio]);

  if (!selectedTopic) return null;

  // Formatter for visual timer 
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Compute percentage progress for 120s live radial countdown ring
  const totalSpeakingDuration = 120;
  const speakingProgressPercent = (speakingTimeLeft / totalSpeakingDuration) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Visual alerts & warning highlights */}
      {micBlocked && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-sm text-red-400 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <span className="font-bold">Microphone Blocked:</span> Please click on the camera/mic icon in your address bar to grant audio access. Spontaneous evaluation requires live microphone recordings.
          </div>
        </div>
      )}

      {warningMessage && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-sm text-amber-400 items-start animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>{warningMessage}</div>
        </div>
      )}

      <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 overflow-hidden shadow-2xl p-8 relative">
        {/* Glow ambient decoration */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-8 border-b border-charcoal-700/60 pb-5">
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-1">
              Spontaneous Session
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              {selectedTopic.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <Radio className="w-4 h-4 shrink-0" />
            Live Recording
          </div>
        </div>

        {/* Selected prompt summary */}
        <div className="mb-8">
          <p className="text-gray-300 text-sm leading-relaxed italic bg-charcoal-900/60 p-4 rounded-xl border border-charcoal-700/50">
            &ldquo;{selectedTopic.description}&rdquo;
          </p>
        </div>

        {/* Waveform Visualizer & SVG countdown timer ring wrapper */}
        <div className="flex flex-col items-center justify-center py-6 gap-6 bg-charcoal-900/40 rounded-2xl border border-charcoal-700/50 p-6 mb-8">
          {/* Circular Countdown Ring */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#1F2937"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#EF4444" // Crimson red countdown highlight
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - speakingProgressPercent / 100)}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center relative z-10 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tight leading-none mb-1">
                {formatTime(speakingTimeLeft)}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Speaking Limit
              </span>
            </div>
          </div>

          {/* Micro Visualizer Waveform Block */}
          <div className="w-full relative">
            <canvas
              ref={canvasRef}
              width="500"
              height="80"
              className="w-full h-20 bg-charcoal-900/60 rounded-xl border border-charcoal-800"
            />
            {!micStreaming && !micBlocked && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                Initializing Web Audio visualizer...
              </span>
            )}
          </div>
        </div>

        {/* Real-time controls buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
          <button
            onClick={cancelSession}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-charcoal-700 hover:border-red-500/30 text-gray-400 hover:text-red-400 bg-charcoal-900 hover:bg-charcoal-800 transition-all font-bold active:scale-95"
          >
            <XCircle className="w-5 h-5" />
            Cancel Session
          </button>

          <button
            onClick={handleStopAndSubmit}
            className="w-full sm:flex-1 flex items-center justify-center gap-2.5 px-8 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-xl shadow-red-600/15"
          >
            <Square className="w-5 h-5 fill-white" />
            Stop & Submit Early
          </button>
        </div>
      </div>
    </div>
  );
}
