"use client";

import { useState } from "react";
import AiChatPanel from "@/components/AiChatPanel";
import OverviewCard from "@/components/OverviewCard";
import RelatedQuestions from "@/components/RelatedQuestions";
import ResultsList from "@/components/ResultsList";
import { Brain } from "lucide-react";
import type { SearchResponse } from "@/lib/search";

interface SearchClientProps {
  searchData: SearchResponse;
}

export default function SearchClient({ searchData }: SearchClientProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const { query, results } = searchData;

  return (
    <div className="flex gap-0 min-h-screen relative">
      {/* Main content */}
      <main
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ maxWidth: chatOpen ? "calc(100% - 380px)" : "100%" }}
      >
        <div className="max-w-2xl px-4 sm:px-6 py-6">
          {/* AI Overview — fetches and answers the query directly */}
          <OverviewCard
            query={query}
            onRelatedQuestions={setRelatedQuestions}
            onDiveDeeper={() => setChatOpen(true)}
          />

          {/* People Also Ask — populated from AI overview response */}
          {relatedQuestions.length > 0 && (
            <RelatedQuestions questions={relatedQuestions} />
          )}

          {/* Results */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-4">
              About {searchData.totalResults} results for &ldquo;{query}&rdquo;
            </p>
            <ResultsList results={results} query={query} />
          </div>

          {/* Bottom Dive Deeper CTA */}
          {!chatOpen && (
            <div className="mt-8 p-5 bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary-900 text-sm">Want more detail?</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ask MedAI follow-up questions about {query}
                </p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-full transition-all duration-200 active:scale-95 shrink-0 ml-4"
              >
                <Brain className="w-4 h-4" />
                Dive Deeper
              </button>
            </div>
          )}
        </div>
      </main>

      {/* AI Chat Panel */}
      {chatOpen && (
        <aside className="w-[380px] shrink-0 border-l border-slate-100 sticky top-0 h-screen overflow-hidden">
          <AiChatPanel
            query={query}
            onClose={() => setChatOpen(false)}
          />
        </aside>
      )}
    </div>
  );
}
