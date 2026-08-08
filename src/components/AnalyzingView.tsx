"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function AnalyzingView() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepsDurations = [2500, 3000, 2500, 2000];
    let timer: NodeJS.Timeout;
    
    const runSteps = (index: number) => {
      if (index >= stepsDurations.length) return;
      timer = setTimeout(() => {
        setCurrentStep(index + 1);
        runSteps(index + 1);
      }, stepsDurations[index]);
    };

    runSteps(0);

    return () => clearTimeout(timer);
  }, []);

  const stepsLabels = [
    "Transcribing audio with Whisper...",
    "Analyzing vocabulary, pronunciation & fluency metrics...",
    "Checking grammar syntaxes and evaluating structures...",
    "Generating personalized native-level rewrite..."
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-charcoal-800 rounded-3xl border border-charcoal-700/80 p-8 shadow-2xl relative overflow-hidden">
        {/* Animated Accent Ripple */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 bg-violet-500/5 rounded-full animate-ping absolute" />
          <div className="w-48 h-48 bg-emerald-500/5 rounded-full animate-pulse absolute" />
        </div>

        <div className="relative z-10">
          {/* Main loader ring spinner */}
          <div className="flex justify-center mb-8">
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Analyzing Speech
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Our AI Language Coach is grading your spontaneous audio...
          </p>

          {/* Stepper block list */}
          <div className="space-y-4 text-left bg-charcoal-900/60 p-5 rounded-2xl border border-charcoal-700/50">
            {stepsLabels.map((label, idx) => {
              const isCompleted = currentStep > idx;
              const isActive = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isCompleted
                      ? "text-emerald-400"
                      : isActive
                      ? "text-white font-semibold scale-[1.02]"
                      : "text-gray-500"
                  }`}
                >
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-charcoal-700 bg-charcoal-800" />
                    )}
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
