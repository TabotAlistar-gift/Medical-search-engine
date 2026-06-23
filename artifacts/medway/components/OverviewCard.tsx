"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Brain,
  CheckCircle2,
} from "lucide-react";

interface OverviewSection {
  heading: string;
  points: string[];
}

interface OverviewData {
  intro: string;
  sections: OverviewSection[];
  summary: string;
  keyFacts: string[];
  relatedQuestions: string[];
  isAIGenerated: boolean;
  disclaimer: string;
  icd10?: string;
}

interface OverviewCardProps {
  query: string;
  mode?: "patient" | "clinician";
  onRelatedQuestions?: (questions: string[]) => void;
}

// Map common section headings to a colour accent
const sectionAccent: Record<string, string> = {
  Symptoms:      "text-rose-600",
  Causes:        "text-amber-600",
  "Risk Factors":"text-orange-600",
  Diagnosis:     "text-violet-600",
  Treatment:     "text-teal-600",
  Prevention:    "text-green-600",
  "Key Facts":   "text-blue-600",
  "How It Works":"text-indigo-600",
  "Who Is Affected": "text-pink-600",
  Background:    "text-slate-600",
  Contributions: "text-cyan-600",
  Legacy:        "text-purple-600",
  // Clinician sections
  Pathophysiology: "text-indigo-600",
  "Diagnostic Criteria": "text-violet-600",
  "Pharmacotherapy Guideline": "text-teal-600",
  "Prognosis & Complications": "text-rose-600",
  "Clinical Presentation": "text-amber-600"
};

function getAccent(heading: string): string {
  return sectionAccent[heading] ?? "text-primary-700";
}

export default function OverviewCard({
  query,
  mode = "patient",
  onRelatedQuestions,
}: OverviewCardProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);

    const modeParam = mode ? `&mode=${mode}` : "";
    fetch(`/mw/overview?q=${encodeURIComponent(query)}${modeParam}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: OverviewData) => {
        setData(d);
        setLoading(false);
        if (d.relatedQuestions?.length) {
          onRelatedQuestions?.(d.relatedQuestions);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [query, mode]);

  if (error) return null;

  return (
    <div className="overview-gradient rounded-2xl p-5 mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-primary-900 text-sm">
            Overview
          </span>
          {data?.isAIGenerated && (
            <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full font-medium">
              AI
            </span>
          )}
          {data?.icd10 && (
            <span className="text-xs text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
              ICD-10: {data.icd10}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-white/60 transition-colors"
          aria-label={expanded ? "Collapse overview" : "Expand overview"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating overview…</span>
              </div>
              <div className="space-y-2">
                {[80, 95, 70, 85, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 bg-primary-100 rounded-full animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </div>
          ) : data ? (
            <>
              {/* ── Intro paragraph ── */}
              {(data.intro || data.summary) && (
                <p className="text-slate-700 text-sm leading-relaxed mb-5 border-l-2 border-primary-300 pl-3">
                  {data.intro || data.summary}
                </p>
              )}

              {/* ── Structured sections ── */}
              {data.sections && data.sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {data.sections.map((section, si) => (
                    <div key={si} className="bg-white/60 rounded-xl px-4 py-3 shadow-sm">
                      {/* Section heading */}
                      <p
                        className={`text-xs font-bold uppercase tracking-wider mb-2 ${getAccent(section.heading)}`}
                      >
                        {section.heading}
                      </p>
                      {/* Bullet points */}
                      <ul className="space-y-1.5">
                        {section.points.map((point, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : data.keyFacts && data.keyFacts.length > 0 ? (
                /* Fallback: show keyFacts if no sections */
                <div className="bg-white/60 rounded-xl px-4 py-3 shadow-sm mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-primary-700">
                    Key Facts
                  </p>
                  <ul className="space-y-1.5">
                    {data.keyFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-500" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}



              {/* ── Disclaimer ── */}
              <div className="flex items-start gap-2 text-xs text-slate-500 border-t border-blue-100 pt-3">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                <span>{data.disclaimer}</span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
