"use client";

import React, { useState } from "react";
import { useSpeakingStore, TOPICS, HistoryItem } from "@/store/useSpeakingStore";
import SpinView from "@/components/SpinView";
import PrepView from "@/components/PrepView";
import RecordView from "@/components/RecordView";
import AnalyzingView from "@/components/AnalyzingView";
import ReportView from "@/components/ReportView";
import {
  History,
  Trash2,
  X,
  Clock,
  BookOpen,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const {
    flowState,
    history,
    clearHistory,
    resetSession,
    setEvaluation,
    setTopic
  } = useSpeakingStore();

  const [modalOpen, setModalOpen] = useState(false);

  // Load a historical run back into active view to inspect previous feedback
  const handleLoadHistoryItem = (item: HistoryItem) => {
    setTopic(TOPICS.find(t => t.title === item.topic) || null);
    setEvaluation(item.evaluation);
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-foreground flex flex-col font-sans relative">
      
      {/* Background radial accent highlights */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header / Navigation bar */}
      <header className="sticky top-0 z-40 bg-charcoal-900/85 backdrop-blur-md border-b border-charcoal-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={resetSession}
            className="flex items-center gap-2.5 group hover:scale-[1.02] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 p-0.5 shadow-lg shadow-violet-500/10">
              <div className="w-full h-full bg-charcoal-900 rounded-[10px] flex items-center justify-center font-black text-white text-lg">
                S
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">
                Spontaneous AI
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Speech Evaluator
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* History Toggle button */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 hover:border-charcoal-600 text-sm font-semibold text-gray-200 transition-all active:scale-95 relative"
            title="Session History"
          >
            <History className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={resetSession}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-black text-white shadow-lg shadow-violet-600/15 active:scale-95 transition-all"
          >
            New Session
          </button>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10 flex flex-col justify-center">
        {/* Dynamic State Machine Renderer */}
        {flowState === "SPIN" && <SpinView />}
        {flowState === "PREP" && <PrepView />}
        {flowState === "RECORD" && <RecordView />}
        {flowState === "ANALYZING" && <AnalyzingView />}
        {flowState === "REPORT" && <ReportView />}
      </main>

      {/* Footer information section */}
      <footer className="border-t border-charcoal-800/80 bg-charcoal-900/50 py-6 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Spontaneous AI Language Practice. Created for accelerated spoken fluency.</p>
      </footer>

      {/* History Sidebar Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-md h-full bg-charcoal-800 border-l border-charcoal-700 shadow-2xl flex flex-col relative animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-charcoal-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet-400" />
                <h3 className="font-black text-lg text-white">Your Spontaneous Runs</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-sm">No spontaneous sessions recorded yet.</p>
                  <p className="text-xs text-gray-500">
                    Your evaluated speeches and timing metrics will be saved here dynamically.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLoadHistoryItem(item)}
                    className="w-full text-left p-4 rounded-2xl bg-charcoal-900/50 border border-charcoal-700 hover:border-violet-500/30 transition-all flex items-start gap-4 hover:scale-[1.01] group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 font-black text-sm">
                      {item.evaluation.overallScore}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors truncate">
                        {item.topic}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 items-center">
                        <span className="text-[10px] px-1.5 py-0.2 bg-charcoal-800 text-gray-400 rounded">
                          {item.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded">
                          {item.targetLanguage}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(item.audioDuration)}s
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-600 block mt-2">
                        {item.timestamp}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0 mt-2" />
                  </button>
                ))
              )}
            </div>

            {/* Clear History footer */}
            {history.length > 0 && (
              <div className="p-6 border-t border-charcoal-700/80 bg-charcoal-900/30">
                <button
                  onClick={clearHistory}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Session History
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
