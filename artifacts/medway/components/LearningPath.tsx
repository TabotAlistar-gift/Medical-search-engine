"use client";

import { useEffect, useState } from "react";
import { Compass, CheckCircle2, ChevronRight, Loader2, Award, X } from "lucide-react";
import Link from "next/link";
import { isStepCompleted, toggleStepCompleted } from "@/lib/userStore";
import StudyNotes from "./StudyNotes";

interface Step {
  title: string;
  description: string;
  query: string;
}

interface LearningPathData {
  current: string;
  steps: Step[];
}

interface Props {
  query: string;
}

export default function LearningPath({ query }: Props) {
  const [data, setData] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progressTrigger, setProgressTrigger] = useState(0); // Simple trigger to force-update state checks
  const [activeStudyQuery, setActiveStudyQuery] = useState<string | null>(null);
  const [activeStepTitle, setActiveStepTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/mw/learningpath?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: LearningPathData) => {
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
        <p className="text-sm text-slate-500 font-medium">Charting your customized learning path / study journey...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
        <Compass className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-800 font-medium">Learning paths are currently unavailable for this topic.</p>
      </div>
    );
  }

  const completedCount = data.steps.filter((s) => isStepCompleted(query, s.title)).length;
  const isFinished = completedCount === data.steps.length && data.steps.length > 0;

  function handleToggle(stepTitle: string) {
    toggleStepCompleted(query, stepTitle);
    setProgressTrigger((p) => p + 1); // Increment trigger to refresh complete indicators
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Health Journey Roadmap</h3>
            <p className="text-xs text-slate-500">Guided study mapping for structured topic mastery</p>
          </div>
        </div>

        {/* Progress Tracker Banner */}
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0 self-start sm:self-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Progress:</span>
          <span className="text-sm font-bold text-teal-600">
            {completedCount} / {data.steps.length} Steps
          </span>
        </div>
      </div>

      {/* Completion Banner */}
      {isFinished && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <Award className="w-7 h-7 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Learning Path Achieved!</h4>
            <p className="text-xs text-emerald-700 leading-normal">
              You have completed all milestones for <span className="font-semibold">{data.current}</span> study journey.
            </p>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="relative pl-6 border-l border-slate-100 space-y-6 ml-3 py-1">
        {data.steps.map((step, idx) => {
          const completed = isStepCompleted(query, step.title);
          return (
            <div key={idx} className="relative">
              {/* Connector Dot */}
              <button
                onClick={() => handleToggle(step.title)}
                className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all focus:outline-none ${completed
                    ? "bg-emerald-500 ring-2 ring-emerald-500/25"
                    : "bg-slate-300 hover:bg-slate-400 ring-2 ring-slate-200/50"
                  }`}
                title={completed ? "Mark as uncompleted" : "Mark as completed"}
              />

              {/* Step content block */}
              <div
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${completed
                    ? "bg-slate-50/50 border-slate-100 opacity-80"
                    : "bg-white border-slate-100 hover:border-teal-100"
                  }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                      Milestone {idx + 1}
                    </span>
                    {completed && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">{step.description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => handleToggle(step.title)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${completed
                        ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      }`}
                  >
                    {completed ? "Undo Check" : "Mark Done"}
                  </button>

                  <button
                    onClick={() => {
                      setActiveStudyQuery(step.query);
                      setActiveStepTitle(step.title);
                    }}
                    className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all"
                  >
                    Study Topic
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Study Topic Modal Overlay */}
      {activeStudyQuery && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setActiveStudyQuery(null);
              setActiveStepTitle(null);
            }}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-widest">
                    Milestone Study Companion
                  </span>
                  <h3 className="font-bold text-slate-800 text-base mt-1">
                    Study Guide: {activeStepTitle}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveStudyQuery(null);
                    setActiveStepTitle(null);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors animate-fade-in"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
                <StudyNotes
                  query={activeStudyQuery}
                  isCompleted={activeStepTitle ? isStepCompleted(query, activeStepTitle) : false}
                  onStudyComplete={() => {
                    if (activeStepTitle) {
                      handleToggle(activeStepTitle);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
