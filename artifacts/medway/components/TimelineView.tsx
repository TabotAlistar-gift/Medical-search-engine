"use client";

import { useEffect, useState } from "react";
import { History, Loader2, AlertCircle } from "lucide-react";

interface TimelineEvent {
  year: string;
  event: string;
  detail: string;
}

interface TimelineResponse {
  title: string;
  events: TimelineEvent[];
}

interface Props {
  query: string;
}

export default function TimelineView({ query }: Props) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/mw/timeline?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: TimelineResponse) => {
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
        <p className="text-sm text-slate-500 font-medium">Tracing historical milestones and medical breakthroughs...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
        <History className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-800 font-medium">Timeline statistics are unavailable for this topic.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{data.title || "Historical Timeline"}</h3>
          <p className="text-xs text-slate-500">Key discovery dates and progress milestones</p>
        </div>
      </div>

      {/* Timeline Nodes */}
      {data.events && data.events.length > 0 ? (
        <div className="relative pl-6 border-l-2 border-primary-100 space-y-8 ml-3 py-2 animate-fade-in">
          {data.events.map((ev, idx) => (
            <div key={idx} className="relative">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary-600 border-4 border-white shadow-sm ring-1 ring-primary-600/30" />

              {/* Event Block */}
              <div className="space-y-1 bg-slate-50/60 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/40 transition-colors">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
                  {ev.year}
                </span>
                <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{ev.event}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light">{ev.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center">No timeline records registered.</p>
      )}
    </div>
  );
}
