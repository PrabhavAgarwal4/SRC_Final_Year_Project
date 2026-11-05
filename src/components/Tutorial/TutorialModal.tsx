import React, { useState } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { TUTORIAL_CHAPTERS, TutorialChapter } from './tutorialData';
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const TutorialModal: React.FC = () => {
  const {
    isTutorialOpen,
    tutorialChapter,
    closeTutorial,
    setTutorialChapter,
  } = useSimulationStore();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  if (!isTutorialOpen) return null;

  const currentChapter =
    TUTORIAL_CHAPTERS.find(c => c.id === tutorialChapter) || TUTORIAL_CHAPTERS[0];

  const handleSelectChapter = (chId: number) => {
    setTutorialChapter(chId);
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const handlePrev = () => {
    if (tutorialChapter > 1) {
      handleSelectChapter(tutorialChapter - 1);
    }
  };

  const handleNext = () => {
    if (tutorialChapter < TUTORIAL_CHAPTERS.length) {
      handleSelectChapter(tutorialChapter + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex overflow-hidden">
        {/* Left Sidebar: Chapters List */}
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                SRC Guided Course
              </div>
              <div className="text-[11px] text-slate-500">
                16 Chapters • From Zero to Proof
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            {TUTORIAL_CHAPTERS.map(ch => {
              const isActive = ch.id === tutorialChapter;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(ch.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-brand-500 text-white font-semibold shadow-xs'
                      : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ch.id}
                  </span>
                  <span className="truncate">{ch.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">
              CHAPTER {currentChapter.id} OF {TUTORIAL_CHAPTERS.length}
            </span>
            <button
              onClick={closeTutorial}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chapter Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {currentChapter.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentChapter.subtitle}
              </p>
            </div>

            {/* Explanation Content */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {currentChapter.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Math Formula Callout */}
            {currentChapter.formula && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-center text-brand-700 dark:text-brand-300 select-all">
                {currentChapter.formula}
              </div>
            )}

            {/* Key Takeaways */}
            <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-brand-900 dark:text-brand-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Key Algorithmic Takeaways</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-brand-800 dark:text-brand-300">
                {currentChapter.keyTakeaways.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>

            {/* Knowledge Check */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-brand-500" />
                <span>Knowledge Check: {currentChapter.question.prompt}</span>
              </div>

              <div className="space-y-2">
                {currentChapter.question.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setHasSubmitted(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-start space-x-2 ${
                        isChosen
                          ? opt.isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium'
                            : 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5">
                        {isChosen ? (
                          opt.isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )
                        ) : null}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {hasSubmitted && selectedOption !== null && (
                <div
                  className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                    currentChapter.question.options[selectedOption].isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {currentChapter.question.options[selectedOption].feedback}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={tutorialChapter <= 1}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>

            <button
              onClick={handleNext}
              disabled={tutorialChapter >= TUTORIAL_CHAPTERS.length}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-30 transition-colors shadow-xs"
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
