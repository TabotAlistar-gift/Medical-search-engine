"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Activity, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Condition {
  name: string;
  likelihood: "High" | "Moderate" | "Low";
  explanation: string;
}

interface SymptomData {
  intro: string;
  conditions: Condition[];
  warning: string;
}

interface Props {
  query: string;
}

export default function SymptomChecker({ query }: Props) {
  const [data, setData] = useState<SymptomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/mw/symptoms?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: SymptomData) => {
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
        <p className="text-sm text-slate-500 font-medium">Analyzing symptoms & cross-referencing databases...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-800 font-medium">Symptom analysis is currently unavailable. Please try again.</p>
      </div>
    );
  }

  const badgeColors = {
    High: "bg-rose-50 border border-rose-200 text-rose-700",
    Moderate: "bg-amber-50 border border-amber-200 text-amber-700",
    Low: "bg-blue-50 border border-blue-200 text-blue-700",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Symptom Analyzer</h3>
          <p className="text-xs text-slate-500">Differential diagnosis mapping based on reported symptoms</p>
        </div>
      </div>

      {/* Intro */}
      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
        {data.intro}
      </p>

      {/* Match Table / List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Potential Matches</h4>
        <div className="grid gap-3">
          {data.conditions.map((c, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-100 hover:border-primary-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-base">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[c.likelihood]}`}>
                    {c.likelihood} Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{c.explanation}</p>
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(c.name)}`}
                className="self-start sm:self-center shrink-0 flex items-center gap-1.5 text-xs text-primary-700 hover:underline font-semibold bg-primary-50 px-3 py-1.5 rounded-full transition-colors hover:bg-primary-100"
              >
                Learn More
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Disclaimer */}
      {data.warning && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Clinical Triage Disclaimer</h5>
            <p className="text-xs text-amber-700 leading-relaxed">{data.warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
