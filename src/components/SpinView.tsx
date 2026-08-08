"use client";

import React, { useState } from "react";
import { useSpeakingStore, TOPICS, Topic } from "@/store/useSpeakingStore";
import { Sparkles, Dices, ArrowRight, Check, HelpCircle, ChevronRight, Globe } from "lucide-react";

export default function SpinView() {
  const {
    selectedCategory,
    selectedTopic,
    targetLanguage,
    setCategory,
    setTargetLanguage,
    setTopic,
    spinTopic,
    startPrep
  } = useSpeakingStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"Beginner" | "Intermediate" | "Advanced">(selectedCategory);

  const handleCategoryChange = (cat: "Beginner" | "Intermediate" | "Advanced") => {
    setActiveCategory(cat);
    setCategory(cat);
    setTopic(null); // Reset selected topic to force a new spin/select
  };

  const handleSpin = () => {
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      spinTopic();
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleTopicSelect = (topic: Topic) => {
    setTopic(topic);
  };

  const handleNext = () => {
    if (selectedTopic) {
      startPrep(15); // Trigger countdown prep mode with 15 seconds
    }
  };

  const filteredTopics = TOPICS.filter((t) => t.category === activeCategory);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header section with category tabs & Target Language */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 bg-charcoal-800/50 p-6 rounded-2xl border border-charcoal-700/60 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            1. Select Your Level
          </h2>
          <div className="flex bg-charcoal-900 p-1.5 rounded-xl border border-charcoal-700 w-fit">
            {(["Beginner", "Intermediate", "Advanced"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeCategory === cat
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Target Language
          </h2>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="bg-charcoal-900 text-gray-200 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 w-full md:w-48 transition-all"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish (Español)</option>
            <option value="French">French (Français)</option>
            <option value="German">German (Deutsch)</option>
            <option value="Japanese">Japanese (日本語)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Spin Picker Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-charcoal-800 rounded-2xl border-2 border-charcoal-700/80 overflow-hidden shadow-2xl relative transition-all">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="p-8 text-center relative z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
                {activeCategory} Category
              </span>

              <h3 className="text-2xl font-black text-white tracking-tight mb-4 min-h-[36px] flex items-center justify-center">
                {selectedTopic ? selectedTopic.title : "No Topic Selected"}
              </h3>

              <div className="bg-charcoal-900/80 rounded-xl p-5 border border-charcoal-700 min-h-[100px] flex items-center justify-center text-gray-300 text-sm italic leading-relaxed">
                {selectedTopic ? (
                  selectedTopic.description
                ) : (
                  <span className="text-gray-500">
                    Click &ldquo;Spin Wheel&rdquo; or pick from the list on the right to discover your spontaneous topic prompt!
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all border ${
                    isSpinning
                      ? "bg-charcoal-700 border-charcoal-600 text-gray-500 cursor-not-allowed"
                      : "bg-charcoal-900 border-charcoal-700 hover:border-violet-500/50 text-white hover:bg-charcoal-800 active:scale-95"
                  }`}
                >
                  <Dices className={`w-5 h-5 text-violet-400 ${isSpinning ? "animate-spin" : ""}`} />
                  {selectedTopic ? "Spin Again" : "Spin Wheel"}
                </button>

                {selectedTopic && (
                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 text-charcoal-900 font-black rounded-xl hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Start Prep Phase
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4 flex gap-3 text-xs text-violet-300/90 leading-relaxed">
            <HelpCircle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-violet-200">How it works:</span> Gather your thoughts for up to 15 seconds after starting prep, then speak for up to 2 minutes. Our AI evaluator analyzes fluency, pauses, filler words, grammar, and suggests high-impact native phrases!
            </div>
          </div>
        </div>

        {/* Right Column: Interactive List of available Level Prompts */}
        <div className="lg:col-span-5 bg-charcoal-800/80 rounded-2xl border border-charcoal-700/80 p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4 flex items-center gap-2">
            Available Prompts ({filteredTopics.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopic?.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between group ${
                    isSelected
                      ? "bg-violet-600/10 border-violet-500/40 text-white"
                      : "bg-charcoal-900/40 border-charcoal-700/60 hover:border-charcoal-600 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="pr-4">
                    <div className="font-bold text-sm leading-tight mb-1 group-hover:text-violet-300 transition-colors">
                      {topic.title}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-1">
                      {topic.description}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
