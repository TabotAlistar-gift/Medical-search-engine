"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface RelatedQuestionsProps {
  questions: string[];
}

export default function RelatedQuestions({ questions }: RelatedQuestionsProps) {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!questions.length) return null;

  const handleClick = (q: string, idx: number) => {
    if (openIndex === idx) {
      setOpenIndex(null);
    } else {
      setOpenIndex(idx);
      // Navigate to search after a brief moment
      setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }, 200);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          People Also Ask
        </span>
      </div>
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        {questions.map((q, i) => (
          <div key={i} className={i > 0 ? "border-t border-slate-100" : ""}>
            <button
              onClick={() => handleClick(q, i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors group"
            >
              <span className="text-sm text-slate-700 group-hover:text-primary-700 transition-colors font-medium pr-4">
                {q}
              </span>
              {openIndex === i ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-sm text-slate-500 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary-400" />
                  <span>Searching for &ldquo;{q}&rdquo;…</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
