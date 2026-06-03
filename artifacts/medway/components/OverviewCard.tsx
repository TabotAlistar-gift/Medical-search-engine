"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Brain,
} from "lucide-react";

interface OverviewData {
  summary: string;
  keyFacts: string[];
  relatedQuestions: string[];
  isAIGenerated: boolean;
  disclaimer: string;
}

interface OverviewCardProps {
  query: string;
  onRelatedQuestion?: (q: string) => void;
  onDiveDeeper?: () => void;
}

export default function OverviewCard({
  query,
  onRelatedQuestion,
  onDiveDeeper,
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

    fetch(`/api/overview?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: OverviewData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [query]);

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
            {data?.isAIGenerated ? "AI Overview" : "Overview"}
          </span>
          {data?.isAIGenerated && (
            <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full font-medium">
              Powered by AI
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
                <span className="text-sm">Generating medical overview…</span>
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
              {/* Summary */}
              <div className="text-slate-700 text-sm leading-relaxed mb-4">
                {data.summary.split("\n\n").map((para, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Key Facts */}
              {data.keyFacts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">
                    Key Facts
                  </p>
                  <ul className="space-y-1.5">
                    {data.keyFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dive Deeper Button */}
              {onDiveDeeper && (
                <button
                  onClick={onDiveDeeper}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-full transition-all duration-200 active:scale-95 mb-4"
                >
                  <Brain className="w-4 h-4" />
                  Dive Deeper with MedAI
                </button>
              )}

              {/* Disclaimer */}
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
