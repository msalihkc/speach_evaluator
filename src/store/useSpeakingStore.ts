import { create } from "zustand";

export type FlowState = "SPIN" | "PREP" | "RECORD" | "ANALYZING" | "REPORT";

export interface GrammarCorrection {
  originalSnippet: string;
  correctedSnippet: string;
  explanation: string;
}

export interface VocabularyEnhancement {
  originalWord: string;
  suggestedAlternatives: string[];
  contextSentence: string;
}

export interface EvaluationMetrics {
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  paceAssessment: "Too Slow" | "Optimal" | "Too Fast";
}

export interface EvaluationReport {
  overallScore: number;
  metrics: EvaluationMetrics;
  strengths: string[];
  weaknesses: string[];
  grammarCorrections: GrammarCorrection[];
  vocabularyEnhancements: VocabularyEnhancement[];
  nativeRewrite: string;
  // Metadata calculated by audio pipeline
  durationSeconds?: number;
  wordCount?: number;
  wpm?: number;
  silenceGaps?: number;
  fillerWordCount?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  topic: string;
  category: "Beginner" | "Intermediate" | "Advanced";
  targetLanguage: string;
  audioDuration: number;
  evaluation: EvaluationReport;
}

export interface Topic {
  id: string;
  title: string;
  category: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}

export const TOPICS: Topic[] = [
  // Beginner Topics
  { id: "b1", title: "Daily Routine", category: "Beginner", description: "Describe what you usually do on a typical Monday morning from the moment you wake up." },
  { id: "b2", title: "Favorite Hobby", category: "Beginner", description: "Talk about a hobby or activity you enjoy doing in your spare time and why you like it." },
  { id: "b3", title: "My Hometown", category: "Beginner", description: "Describe your hometown or the place where you currently live, focusing on its main features." },
  { id: "b4", title: "A Memorable Meal", category: "Beginner", description: "Talk about an amazing meal you had recently. What did you eat, and who was with you?" },
  { id: "b5", title: "Weekend Plans", category: "Beginner", description: "Explain what your ideal weekend looks like and what plans you have for the upcoming weekend." },

  // Intermediate Topics
  { id: "i1", title: "Remote Work vs. Office", category: "Intermediate", description: "Compare the pros and cons of working remotely versus working in a physical office space." },
  { id: "i2", title: "Impact of Social Media", category: "Intermediate", description: "Discuss how social media platforms have altered the way we communicate with friends and family." },
  { id: "i3", title: "Healthy Lifestyle", category: "Intermediate", description: "What does it mean to live a healthy life today? Discuss diet, exercise, and mental well-being." },
  { id: "i4", title: "Traveling Abroad", category: "Intermediate", description: "Talk about how traveling to a foreign country can broaden someone's perspective or challenge them." },
  { id: "i5", title: "The Perfect Job", category: "Intermediate", description: "Describe the characteristics of a dream job or your ideal work culture and environment." },

  // Advanced Topics
  { id: "a1", title: "Ethics of AI", category: "Advanced", description: "Evaluate the ethical implications of artificial intelligence in decision-making and creative fields." },
  { id: "a2", title: "Climate Change & Action", category: "Advanced", description: "Analyze the balance between economic development and strict environmental regulation for carbon emissions." },
  { id: "a3", title: "Universal Basic Income", category: "Advanced", description: "Argue for or against the implementation of a national Universal Basic Income (UBI) program." },
  { id: "a4", title: "The Future of Education", category: "Advanced", description: "Will traditional universities become obsolete? Discuss the rise of online certifications and self-paced learning." },
  { id: "a5", title: "Global Cultural Homogenization", category: "Advanced", description: "Examine whether globalization is destroying local cultures or fostering a more unified global community." }
];

interface SpeakingStore {
  flowState: FlowState;
  selectedCategory: "Beginner" | "Intermediate" | "Advanced";
  selectedTopic: Topic | null;
  targetLanguage: string;
  prepTimeLeft: number; // in seconds, typically 15s or 30s
  speakingTimeLeft: number; // in seconds, typically 120s
  isRecording: boolean;
  history: HistoryItem[];
  currentEvaluation: EvaluationReport | null;
  errorMessage: string | null;

  // Actions
  setFlowState: (state: FlowState) => void;
  setCategory: (category: "Beginner" | "Intermediate" | "Advanced") => void;
  setTargetLanguage: (lang: string) => void;
  setTopic: (topic: Topic | null) => void;
  spinTopic: () => void;
  startPrep: (duration?: number) => void;
  decrementPrep: () => void;
  skipPrep: () => void;
  startRecording: () => void;
  decrementSpeaking: () => void;
  stopRecording: () => void;
  cancelSession: () => void;
  setEvaluation: (report: EvaluationReport) => void;
  setErrorMessage: (msg: string | null) => void;
  resetSession: () => void;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export const useSpeakingStore = create<SpeakingStore>((set, get) => ({
  flowState: "SPIN",
  selectedCategory: "Intermediate",
  selectedTopic: null,
  targetLanguage: "English",
  prepTimeLeft: 15,
  speakingTimeLeft: 120,
  isRecording: false,
  history: [],
  currentEvaluation: null,
  errorMessage: null,

  setFlowState: (flowState) => set({ flowState }),
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
  setTopic: (selectedTopic) => set({ selectedTopic }),
  
  spinTopic: () => {
    const { selectedCategory } = get();
    const filtered = TOPICS.filter(t => t.category === selectedCategory);
    if (filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      set({ selectedTopic: filtered[randomIndex] });
    }
  },

  startPrep: (duration = 15) => {
    set({
      flowState: "PREP",
      prepTimeLeft: duration,
      speakingTimeLeft: 120,
      isRecording: false,
      errorMessage: null
    });
  },

  decrementPrep: () => {
    const { prepTimeLeft } = get();
    if (prepTimeLeft <= 1) {
      get().skipPrep();
    } else {
      set({ prepTimeLeft: prepTimeLeft - 1 });
    }
  },

  skipPrep: () => {
    set({
      flowState: "RECORD",
      prepTimeLeft: 0,
      isRecording: true,
      speakingTimeLeft: 120
    });
  },

  startRecording: () => {
    set({
      flowState: "RECORD",
      isRecording: true,
      speakingTimeLeft: 120,
      errorMessage: null
    });
  },

  decrementSpeaking: () => {
    const { speakingTimeLeft } = get();
    if (speakingTimeLeft <= 1) {
      set({ speakingTimeLeft: 0, isRecording: false });
    } else {
      set({ speakingTimeLeft: speakingTimeLeft - 1 });
    }
  },

  stopRecording: () => {
    set({ isRecording: false, flowState: "ANALYZING" });
  },

  cancelSession: () => {
    set({
      flowState: "SPIN",
      isRecording: false,
      selectedTopic: null,
      prepTimeLeft: 15,
      speakingTimeLeft: 120,
      currentEvaluation: null,
      errorMessage: null
    });
  },

  setEvaluation: (currentEvaluation) => {
    set({ currentEvaluation, flowState: "REPORT" });
  },

  setErrorMessage: (errorMessage) => set({ errorMessage }),

  resetSession: () => {
    set({
      flowState: "SPIN",
      selectedTopic: null,
      prepTimeLeft: 15,
      speakingTimeLeft: 120,
      currentEvaluation: null,
      errorMessage: null
    });
  },

  addToHistory: (item) => {
    set((state) => ({ history: [item, ...state.history] }));
  },

  clearHistory: () => set({ history: [] })
}));
