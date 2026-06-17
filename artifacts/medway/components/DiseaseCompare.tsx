"use client";

import { useEffect, useState } from "react";
import { GitCompare, Loader2, Search, HelpCircle, AlertTriangle } from "lucide-react";

interface Row {
  feature: string;
  c1Value: string;
  c2Value: string;
}

interface ComparisonResponse {
  headers: string[];
  rows: Row[];
}

interface Props {
  query: string;
}

export default function DiseaseCompare({ query }: Props) {
  const [target, setTarget] = useState("");
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Suggestions for comparison
  const suggestedComparisons: Record<string, string> = {
    malaria: "Typhoid",
    typhoid: "Malaria",
    diabetes: "Hypertension",
    hypertension: "Diabetes",
    asthma: "COPD",
    copd: "Asthma",
    influenza: "COVID-19",
    "covid-19": "Influenza",
    "common cold": "Allergic Rhinitis",
    migraine: "Tension Headache",
  };

  const cleanQuery = query.toLowerCase().trim();
  const suggestion = suggestedComparisons[cleanQuery] || "Typhoid";

  function handleCompare(t: string) {
    if (!t.trim()) return;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/mw/compare?q1=${encodeURIComponent(query)}&q2=${encodeURIComponent(t.trim())}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to compare");
        return r.json();
      })
      .then((d: ComparisonResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          <GitCompare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Differential Comparison</h3>
          <p className="text-xs text-slate-500">Cross-reference clinical parameters side-by-side</p>
        </div>
      </div>

      {/* Input Selector */}
      {!data && !loading && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600 font-medium">
            Compare <span className="font-semibold text-primary-700">&ldquo;{query}&rdquo;</span> with another medical condition:
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={`Search condition (e.g. ${suggestion})`}
                className="w-full text-slate-800 text-sm bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleCompare(target)}
              />
            </div>
            <button
              onClick={() => handleCompare(target)}
              disabled={!target.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Compare
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400">Suggested:</span>
            <button
              onClick={() => {
                setTarget(suggestion);
                handleCompare(suggestion);
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 font-semibold border border-slate-200/50 transition-colors"
            >
              {suggestion}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Compiling comparison rows...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-sm text-rose-800 font-medium">Comparison failed. Try comparing standard medical terms.</p>
          <button
            onClick={() => {
              setData(null);
              setLoading(false);
              setError(false);
            }}
            className="mt-2 text-xs text-primary-700 hover:underline font-semibold"
          >
            ← Back to Input
          </button>
        </div>
      )}

      {/* Comparison Matrix Table */}
      {data && !loading && (
        <div className="space-y-4 animate-fade-in">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {data.headers.map((h, i) => (
                    <th key={i} className="p-3.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800 bg-slate-50/40">{row.feature}</td>
                    <td className="p-3.5 text-slate-600 font-light leading-relaxed">{row.c1Value}</td>
                    <td className="p-3.5 text-slate-600 font-light leading-relaxed">{row.c2Value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setData(null);
                setTarget("");
              }}
              className="text-xs text-primary-700 hover:underline font-semibold bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-full transition-colors"
            >
              Compare with Another Condition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
