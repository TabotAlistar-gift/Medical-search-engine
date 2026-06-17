"use client";

import { useEffect, useState } from "react";
import { BookOpen, HelpCircle, GraduationCap, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { saveQuizScore } from "@/lib/userStore";

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

interface StudyData {
  facts: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  mnemonics: string[];
}

interface Props {
  query: string;
}

type Mode = "facts" | "flashcards" | "quiz";

export default function StudyHub({ query }: Props) {
  const [data, setData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<Mode>("facts");

  // Flashcards state
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);
    setMode("facts");
    setCurrentCard(0);
    setIsFlipped(false);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);

    fetch(`/mw/study?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: StudyData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [query]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Assembling quiz questions, mnemonics, and flashcards...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
        <GraduationCap className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-800 font-medium">Study materials are currently unavailable for this topic.</p>
      </div>
    );
  }

  // Quiz Functions
  function handleSelectOption(idx: number) {
    if (isAnswered) return;
    setSelectedOption(idx);
  }

  function handleSubmitAnswer() {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);
    const correct = selectedOption === data!.quiz[currentQuestion].answerIndex;
    if (correct) {
      setScore((s) => s + 1);
    }
  }

  function handleNextQuestion() {
    const nextIdx = currentQuestion + 1;
    if (nextIdx < data!.quiz.length) {
      setCurrentQuestion(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      saveQuizScore(query, score + (selectedOption === data!.quiz[currentQuestion].answerIndex ? 1 : 0), data!.quiz.length);
    }
  }

  function handleResetQuiz() {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Interactive Study Hub</h3>
            <p className="text-xs text-slate-500">Accelerated learning guide and study assets</p>
          </div>
        </div>

        {/* Mini Tab Select */}
        <div className="flex bg-slate-150 p-1 rounded-xl self-start sm:self-center">
          {(["facts", "flashcards", "quiz"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${mode === m
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {m === "facts" ? "Quick Facts" : m === "flashcards" ? "Flashcards" : "Study Quiz"}
            </button>
          ))}
        </div>
      </div>

      {/* Facts Mode */}
      {mode === "facts" && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick facts bullet list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">High-Yield Knowledge Points</h4>
            <ul className="space-y-2.5">
              {data.facts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mnemonics */}
          {data.mnemonics && data.mnemonics.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Memory Mnemonics</h4>
              <div className="grid gap-3">
                {data.mnemonics.map((mnem, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-violet-50 to-teal-50 border border-violet-100 p-4 rounded-xl text-sm text-violet-900 font-medium">
                    {mnem}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flashcards Mode */}
      {mode === "flashcards" && (
        <div className="flex flex-col items-center justify-center py-4 space-y-6 animate-fade-in">
          {data.flashcards && data.flashcards.length > 0 ? (
            <>
              {/* Cards remaining indicators */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Card {currentCard + 1} of {data.flashcards.length}
              </p>

              {/* Interactive Flippable Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-md h-56 cursor-pointer border border-slate-200 rounded-2xl p-6 flex items-center justify-center text-center transition-all duration-300 relative bg-slate-50 shadow-sm hover:shadow-md"
              >
                {!isFlipped ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Question</p>
                    <p className="font-semibold text-slate-800 text-lg leading-relaxed">{data.flashcards[currentCard].question}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest absolute bottom-4 left-1/2 -translate-x-1/2">Click Card to Flip</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Answer Definition</p>
                    <p className="text-slate-700 text-base leading-relaxed font-normal">{data.flashcards[currentCard].answer}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest absolute bottom-4 left-1/2 -translate-x-1/2">Click Card to Flip</p>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-4">
                <button
                  disabled={currentCard === 0}
                  onClick={() => {
                    setCurrentCard((c) => c - 1);
                    setIsFlipped(false);
                  }}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={currentCard === data.flashcards.length - 1}
                  onClick={() => {
                    setCurrentCard((c) => c + 1);
                    setIsFlipped(false);
                  }}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No flashcards available.</p>
          )}
        </div>
      )}

      {/* Quiz Mode */}
      {mode === "quiz" && (
        <div className="space-y-6 animate-fade-in">
          {data.quiz && data.quiz.length > 0 ? (
            !quizFinished ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Question {currentQuestion + 1} of {data.quiz.length}
                  </p>
                  <p className="text-xs font-semibold text-violet-700">
                    Running Score: {score}/{data.quiz.length}
                  </p>
                </div>

                {/* Question */}
                <p className="font-semibold text-slate-800 text-base leading-relaxed">
                  {data.quiz[currentQuestion].question}
                </p>

                {/* Options list */}
                <div className="grid gap-2">
                  {data.quiz[currentQuestion].options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOption = idx === data.quiz[currentQuestion].answerIndex;
                    let borderClass = "border-slate-200 hover:border-violet-300 hover:bg-slate-50";

                    if (isAnswered) {
                      if (isCorrectOption) {
                        borderClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                      } else if (isSelected) {
                        borderClass = "border-rose-500 bg-rose-50 text-rose-900";
                      } else {
                        borderClass = "border-slate-100 opacity-60";
                      }
                    } else if (isSelected) {
                      borderClass = "border-violet-600 bg-violet-50 text-violet-900";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(idx)}
                        className={`text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between font-medium ${borderClass}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrectOption && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 ml-3" />}
                        {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 ml-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Rationale explanation display */}
                {isAnswered && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Rationale</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {data.quiz[currentQuestion].rationale}
                    </p>
                  </div>
                )}

                {/* Next / Submit Trigger */}
                <div className="flex justify-end pt-2">
                  {!isAnswered ? (
                    <button
                      disabled={selectedOption === null}
                      onClick={handleSubmitAnswer}
                      className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                    >
                      Submit Response
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-full bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      {currentQuestion === data.quiz.length - 1 ? "Complete Quiz" : "Next Question"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Quiz Finished Screen
              <div className="text-center py-6 space-y-4">
                <GraduationCap className="w-16 h-16 text-violet-600 mx-auto" />
                <h4 className="font-bold text-slate-800 text-xl">Study Quiz Finished!</h4>
                <p className="text-sm text-slate-500">
                  You scored <span className="font-bold text-violet-700 text-base">{score}</span> out of{" "}
                  <span className="font-bold text-slate-800">{data.quiz.length}</span> correct answers.
                </p>
                <div className="w-32 bg-slate-100 rounded-full h-2.5 mx-auto">
                  <div
                    className="bg-violet-600 h-2.5 rounded-full"
                    style={{ width: `${(score / data.quiz.length) * 100}%` }}
                  />
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={handleResetQuiz}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-semibold text-slate-600 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Quiz
                  </button>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500 text-center">No quiz questions generated.</p>
          )}
        </div>
      )}
    </div>
  );
}
