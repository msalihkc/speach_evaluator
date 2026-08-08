"use client";

import React, { useState, useEffect } from "react";
import { useSpeakingStore } from "@/store/useSpeakingStore";
import {
  Sparkles,
  Award,
  Zap,
  BookOpen,
  Volume2,
  VolumeX,
  Clipboard,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Mic,
  Activity,
  AlertTriangle,
  Download
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ReportView() {
  const {
    currentEvaluation,
    selectedTopic,
    resetSession,
    startPrep
  } = useSpeakingStore();

  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // Expanded grammar sections tracking
  const [expandedGrammar, setExpandedGrammar] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Fire celebratory confetti on high score reports!
    if (currentEvaluation && currentEvaluation.overallScore >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#8B5CF6", "#F3F4F6"]
      });
    }
  }, [currentEvaluation]);

  // Clean TTS speaking on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!currentEvaluation) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">No evaluation feedback available. Start speaking to generate reports!</p>
        <button onClick={resetSession} className="mt-4 px-6 py-2.5 bg-violet-600 rounded-xl text-white font-semibold">
          Try Again
        </button>
      </div>
    );
  }

  const {
    overallScore,
    metrics,
    strengths,
    weaknesses,
    grammarCorrections,
    vocabularyEnhancements,
    nativeRewrite,
    durationSeconds,
    wordCount,
    wpm,
    silenceGaps,
    fillerWordCount,
    transcript
  } = currentEvaluation;

  // Helper to render transcript with highlighted filler words and grammar issues
  const renderHighlightedTranscript = (text: string, corrections: typeof grammarCorrections) => {
    if (!text) return null;

    const fillersList = ["um", "uh", "like", "you know", "so yeah"];
    
    interface Annotation {
      start: number;
      end: number;
      type: "filler" | "grammar";
      content: string;
      meta?: {
        index: number;
        correction: string;
        explanation: string;
      };
    }
    
    const annotations: Annotation[] = [];

    // Find grammar corrections in transcript
    corrections?.forEach((corr, index) => {
      const snippet = corr.originalSnippet;
      if (!snippet) return;
      
      const escaped = snippet.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        annotations.push({
          start: match.index,
          end: match.index + match[0].length,
          type: "grammar",
          content: match[0],
          meta: { index, correction: corr.correctedSnippet, explanation: corr.explanation }
        });
      }
    });

    // Find filler words in transcript
    fillersList.forEach((filler) => {
      const escaped = filler.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        const isOverlapping = annotations.some(
          ann => (match!.index >= ann.start && match!.index < ann.end) || 
                 (match!.index + match![0].length > ann.start && match!.index + match![0].length <= ann.end)
        );
        if (!isOverlapping) {
          annotations.push({
            start: match.index,
            end: match.index + match[0].length,
            type: "filler",
            content: match[0]
          });
        }
      }
    });

    annotations.sort((a, b) => a.start - b.start);

    const nonOverlapping: Annotation[] = [];
    let lastEnd = 0;
    for (const ann of annotations) {
      if (ann.start >= lastEnd) {
        nonOverlapping.push(ann);
        lastEnd = ann.end;
      }
    }

    const result: React.ReactNode[] = [];
    let currentIdx = 0;

    nonOverlapping.forEach((ann, idx) => {
      if (ann.start > currentIdx) {
        result.push(<span key={`text-${idx}`}>{text.substring(currentIdx, ann.start)}</span>);
      }

      if (ann.type === "grammar") {
        result.push(
          <span
            key={`ann-${idx}`}
            className="group relative inline-block bg-red-500/10 border border-red-500/30 text-red-400 font-medium px-1.5 py-0.5 rounded cursor-pointer transition-all hover:bg-red-500/20 underline decoration-red-500/40 decoration-2 underline-offset-2"
          >
            {ann.content}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-charcoal-900 border border-charcoal-700 text-gray-200 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 font-normal leading-normal whitespace-normal">
              <span className="font-bold text-red-400 block mb-1">Grammar correction:</span>
              <span className="line-through text-gray-500">&ldquo;{ann.content}&rdquo;</span> &rarr; <span className="text-emerald-400 font-semibold">&ldquo;{ann.meta?.correction}&rdquo;</span>
              <span className="block mt-1.5 border-t border-charcoal-800 pt-1.5 text-gray-400">{ann.meta?.explanation}</span>
            </span>
          </span>
        );
      } else {
        result.push(
          <span
            key={`ann-${idx}`}
            className="inline-block bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded font-medium text-xs mx-0.5"
          >
            {ann.content}
          </span>
        );
      }

      currentIdx = ann.end;
    });

    if (currentIdx < text.length) {
      result.push(<span key="text-end">{text.substring(currentIdx)}</span>);
    }

    return result;
  };

  // Toggle helper for grammar snippet accordions
  const toggleGrammar = (idx: number) => {
    setExpandedGrammar((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Copy helper
  const handleCopyText = (text: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Text to Speech Toggle
  const handleToggleTTS = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech reading is not supported by your browser environment.");
      return;
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else {
      const cleanRewrite = nativeRewrite.replace(/["']/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanRewrite);
      
      utterance.onend = () => {
        setIsPlayingTTS(false);
      };
      utterance.onerror = () => {
        setIsPlayingTTS(false);
      };

      setIsPlayingTTS(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Download raw metrics & breakdown report as local summary file
  const handleDownloadReport = () => {
    const summaryText = `SPEECH EVALUATION REPORT
=========================
Topic: ${selectedTopic?.title || "Spontaneous Speaking"}
Overall Score: ${overallScore}/100

METRICS BREAKDOWN:
- Fluency Score: ${metrics.fluencyScore}/100
- Grammar Score: ${metrics.grammarScore}/100
- Vocabulary Score: ${metrics.vocabularyScore}/100
- Pace Assessment: ${metrics.paceAssessment}

TIMING & AUDIO METRICS:
- Duration: ${durationSeconds || 0} seconds
- Total Word Count: ${wordCount || 0} words
- Words Per Minute (WPM): ${wpm || 0} WPM
- Silence Gaps (>1.5s): ${silenceGaps || 0}
- Filler Words: ${fillerWordCount || 0}

STRENGTHS:
${strengths.map(s => `- ${s}`).join("\n")}

AREAS FOR IMPROVEMENT:
${weaknesses.map(w => `- ${w}`).join("\n")}

NATIVE LEVEL REWRITE:
"${nativeRewrite}"
`;
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Speech_Report_${selectedTopic?.title.replace(/\s+/g, "_") || "session"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Top Score summary Dashboard banner */}
      <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Glow backdrop decorator */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 z-10 text-center sm:text-left">
          {/* Radial score progress block */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="56" cy="56" r="50" stroke="#1F2937" strokeWidth="6" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke={overallScore >= 80 ? "#10B981" : "#8B5CF6"}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - overallScore / 100)}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white leading-none">{overallScore}</span>
              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Score</span>
            </div>
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2 inline-block">
              {selectedTopic?.category} Category
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Speech Evaluation: {selectedTopic?.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-md">
              Nice work! Here is your spontaneous feedback analyzed by our speech evaluators.
            </p>
          </div>
        </div>

        {/* Rating sub-badges display */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto z-10 shrink-0">
          <div className="bg-charcoal-900/60 border border-charcoal-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1">Fluency</span>
            <span className="text-lg font-black text-emerald-400">{metrics.fluencyScore}</span>
          </div>
          <div className="bg-charcoal-900/60 border border-charcoal-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1">Grammar</span>
            <span className="text-lg font-black text-violet-400">{metrics.grammarScore}</span>
          </div>
          <div className="bg-charcoal-900/60 border border-charcoal-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1">Vocab</span>
            <span className="text-lg font-black text-yellow-400">{metrics.vocabularyScore}</span>
          </div>
        </div>
      </div>

      {/* Grid: Audio metrics & Side-by-Side Strengths-Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: WPM and breakdown metrics cards */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Pacing & Audio Metrics
            </h3>

            <div className="space-y-5">
              {/* WPM Progress card */}
              <div className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-400">Words Per Minute (WPM)</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase">
                    {metrics.paceAssessment}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-white">{wpm || 0}</span>
                  <span className="text-xs text-gray-400 font-semibold">wpm</span>
                </div>
                {/* WPM gauge meter slider */}
                <div className="w-full bg-charcoal-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(20, ((wpm || 100) / 200) * 100))}%` }}
                  />
                  {/* Indicator mark bounds for optimal pace: 110 - 150 WPM */}
                  <div className="absolute top-0 bottom-0 left-[55%] w-0.5 bg-violet-400/50" />
                  <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-violet-400/50" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1.5 block">
                  Optimal speaking pace is usually 110 - 150 WPM.
                </span>
              </div>

              {/* Stat grid duration, gaps, fillers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    Duration
                  </div>
                  <div className="text-xl font-bold text-white">{durationSeconds || 0}s</div>
                </div>

                <div className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Mic className="w-3.5 h-3.5 text-gray-500" />
                    Filler Words
                  </div>
                  <div className="text-xl font-bold text-white">{fillerWordCount || 0}</div>
                </div>
              </div>

              {/* Pause intervals statistic */}
              <div className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Silence Pauses</span>
                  <span className="text-xs text-gray-500 leading-normal">
                    Duration gaps &gt; 1.5s
                  </span>
                </div>
                <span className="text-2xl font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-xl">
                  {silenceGaps || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Strengths and Weaknesses Side-By-Side Grid */}
        <div className="lg:col-span-8 bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-6 shadow-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-charcoal-700/60 pb-3">
            <Award className="w-4 h-4 text-violet-400" />
            Side-By-Side Coaching Review
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Strengths */}
            <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Key Strengths
              </h4>
              <ul className="space-y-3">
                {strengths.map((str, idx) => (
                  <li key={idx} className="text-gray-300 text-sm leading-relaxed flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Improvements */}
            <div className="bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Areas for Improvement
              </h4>
              <ul className="space-y-3">
                {weaknesses.map((weak, idx) => (
                  <li key={idx} className="text-gray-300 text-sm leading-relaxed flex gap-2.5 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Speech Transcript Card */}
      {transcript && (
        <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-charcoal-700/60 pb-3">
            <Mic className="w-4 h-4 text-violet-400" />
            Speech Transcript & Highlighted Analysis
          </h3>
          
          <div className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-6 relative">
            <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap font-sans select-text">
              {renderHighlightedTranscript(transcript, grammarCorrections)}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/25" />
              <span>Filler word (um, uh, like)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/10 border border-red-500/30" />
              <span>Grammar adjustment (hover for correction)</span>
            </div>
          </div>
        </div>
      )}

      {/* Grammar Corrections section */}
      {grammarCorrections && grammarCorrections.length > 0 && (
        <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-6 shadow-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-charcoal-700/60 pb-3">
            <BookOpen className="w-4 h-4 text-violet-400" />
            Grammar & Syntax Adjustments ({grammarCorrections.length})
          </h3>

          <div className="space-y-4">
            {grammarCorrections.map((corr, idx) => {
              const isOpen = !!expandedGrammar[idx];
              return (
                <div
                  key={idx}
                  className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleGrammar(idx)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-charcoal-800/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 line-through">
                        &ldquo;{corr.originalSnippet}&rdquo;
                      </span>
                      <span className="text-xs font-semibold text-gray-400 hidden sm:inline">&rarr;</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        &ldquo;{corr.correctedSnippet}&rdquo;
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-charcoal-900/80 border-t border-charcoal-800/80 text-sm text-gray-300 leading-relaxed">
                      <p className="font-semibold text-violet-400 mb-1">Explanation:</p>
                      {corr.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vocabulary upgrade chips */}
      {vocabularyEnhancements && vocabularyEnhancements.length > 0 && (
        <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-6 shadow-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-charcoal-700/60 pb-3">
            <Zap className="w-4 h-4 text-violet-400" />
            Vocabulary Enhancement Upgrades
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vocabularyEnhancements.map((vocab, idx) => (
              <div
                key={idx}
                className="bg-charcoal-900/60 border border-charcoal-700/40 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-charcoal-800 pb-2">
                  <span className="text-xs text-gray-400">Instead of using basic word:</span>
                  <span className="text-sm font-bold text-red-400 underline decoration-red-400/50 decoration-2">
                    &ldquo;{vocab.originalWord}&rdquo;
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-gray-400 block">Try upgrading to:</span>
                  <div className="flex flex-wrap gap-2">
                    {vocab.suggestedAlternatives.map((alt, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-500/25 shadow-sm hover:scale-105 hover:bg-violet-600 hover:text-white cursor-pointer transition-all"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs italic leading-relaxed text-gray-300 bg-charcoal-950 p-3 rounded-lg border border-charcoal-800">
                  <span className="font-bold text-violet-400 block not-italic mb-0.5">Example usage context:</span>
                  &ldquo;{vocab.contextSentence}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styled Native level rewrite section */}
      <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 overflow-hidden shadow-xl relative">
        <div className="bg-charcoal-900/80 px-6 py-4 flex items-center justify-between border-b border-charcoal-700/80">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Personalized Native-Level Rewrite
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Audio Read-Aloud Toggle Button */}
            <button
              onClick={handleToggleTTS}
              className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isPlayingTTS
                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/25"
                  : "bg-charcoal-800 border-charcoal-700 hover:border-charcoal-600 text-gray-300 hover:text-white"
              }`}
              title="Toggle audio recitation of rewrite"
            >
              {isPlayingTTS ? <VolumeX className="w-4 h-4 text-red-400 animate-pulse" /> : <Volume2 className="w-4 h-4 text-violet-400" />}
              {isPlayingTTS ? "Stop TTS Reciting" : "Audio Read-Aloud"}
            </button>

            {/* Clipboard copy toggle */}
            <button
              onClick={() => handleCopyText(nativeRewrite, setCopiedRewrite)}
              className="p-2 rounded-lg bg-charcoal-800 border border-charcoal-700 hover:border-charcoal-600 text-gray-300 hover:text-white transition-all"
              title="Copy to clipboard"
            >
              {copiedRewrite ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-charcoal-950 rounded-2xl p-6 border border-charcoal-800 relative">
            <p className="text-gray-200 text-base leading-relaxed italic whitespace-pre-wrap">
              &ldquo;{nativeRewrite}&rdquo;
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mt-3 italic leading-normal">
            This represents how a native level professional speaker would restructure your spoken points while maintaining the integrity of your original thoughts and ideas.
          </p>
        </div>
      </div>

      {/* Global CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between border-t border-charcoal-700/40 pt-8">
        <button
          onClick={handleDownloadReport}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-charcoal-700 hover:border-violet-500/30 text-gray-300 hover:text-white hover:bg-charcoal-800 transition-all font-bold active:scale-95"
        >
          <Download className="w-5 h-5 text-violet-400" />
          Download PDF Summary (.txt)
        </button>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => startPrep(15)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-charcoal-700 hover:border-emerald-500/20 text-gray-300 hover:text-white hover:bg-charcoal-800 transition-all font-bold active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            Retry Same Topic
          </button>

          <button
            onClick={resetSession}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-500 active:scale-95 transition-all shadow-xl shadow-violet-600/15"
          >
            Try Another Topic
          </button>
        </div>
      </div>

    </div>
  );
}
