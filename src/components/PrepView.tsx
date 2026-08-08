"use client";

import React, { useEffect } from "react";
import { useSpeakingStore } from "@/store/useSpeakingStore";
import { Hourglass, Play, ArrowLeft, Lightbulb } from "lucide-react";

export default function PrepView() {
  const {
    selectedTopic,
    prepTimeLeft,
    decrementPrep,
    skipPrep,
    cancelSession
  } = useSpeakingStore();

  useEffect(() => {
    const interval = setInterval(() => {
      decrementPrep();
    }, 1000);

    return () => clearInterval(interval);
  }, [decrementPrep]);

  if (!selectedTopic) return null;

  // Visual percentages for countdown circular timer/bar
  const totalPrepTime = 15;
  const progressPercent = (prepTimeLeft / totalPrepTime) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 overflow-hidden shadow-2xl p-8 relative">
        {/* Glow behind timer */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Navigation & Topic Context */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={cancelSession}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Select
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 animate-pulse" />
            Prep Phase
          </span>
        </div>

        {/* Selected Topic info */}
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-2">
            Selected Topic ({selectedTopic.category})
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mb-4">
            {selectedTopic.title}
          </h2>
          <p className="text-gray-300 leading-relaxed text-base bg-charcoal-900/50 p-5 rounded-2xl border border-charcoal-700/60 italic">
            &ldquo;{selectedTopic.description}&rdquo;
          </p>
        </div>

        {/* Dynamic Countdown Circle / Visual Meter */}
        <div className="flex flex-col items-center justify-center py-6 mb-8 bg-charcoal-900/40 rounded-2xl border border-charcoal-700/40 p-6">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            {/* SVG Progress Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#1F2937"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#10B981"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - progressPercent / 100)}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-4xl font-black text-white relative z-10">
              {prepTimeLeft}s
            </span>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Gathering thoughts...
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-charcoal-700/60 pt-6">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lightbulb className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Tip: Jot down 2 main talking points!</span>
          </div>

          <button
            onClick={skipPrep}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-charcoal-900 font-black rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
          >
            <Play className="w-5 h-5 fill-charcoal-900" />
            Skip Prep & Start Speaking
          </button>
        </div>
      </div>
    </div>
  );
}
