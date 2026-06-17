"use client";

import { useEffect, useState } from "react";
import AiChatPanel from "@/components/AiChatPanel";
import OverviewCard from "@/components/OverviewCard";
import RelatedQuestions from "@/components/RelatedQuestions";
import ResultsList from "@/components/ResultsList";
import SymptomChecker from "@/components/SymptomChecker";
import StudyHub from "@/components/StudyHub";
import DiseaseCompare from "@/components/DiseaseCompare";
import TimelineView from "@/components/TimelineView";
import LearningPath from "@/components/LearningPath";
import { exportMedicalReport } from "@/lib/reportExporter";
import {
  Brain,
  Search,
  Activity,
  GraduationCap,
  GitCompare,
  History,
  Compass,
  FileText,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import type { SearchResponse, SearchResult } from "@/lib/search";
import { useAuth } from "@/context/AuthContext";
import { saveSearch, saveArticle, removeArticle, isArticleSaved } from "@/lib/userStore";

interface SearchClientProps {
  searchData: SearchResponse;
}

type TabType = "all" | "symptoms" | "study" | "compare" | "timeline" | "journey";

export default function SearchClient({ searchData }: SearchClientProps) {
  const { isLoggedIn } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [interactionData, setInteractionData] = useState<any | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(false);
  const [includeStudy, setIncludeStudy] = useState(false);
  const [includeTimeline, setIncludeTimeline] = useState(false);
  const [compilingStatus, setCompilingStatus] = useState<string | null>(null);

  const { query, results } = searchData;

  // Auto-save search to history when user is logged in
  useEffect(() => {
    if (isLoggedIn && query) {
      saveSearch(query);
    }
  }, [isLoggedIn, query]);

  // Load already-saved articles state on mount
  useEffect(() => {
    if (isLoggedIn) {
      const saved = new Set(
        results.filter((r) => isArticleSaved(r.url)).map((r) => r.url)
      );
      setSavedUrls(saved);
    }
  }, [isLoggedIn, results]);

  // Check for potential drug interactions automatically on search
  useEffect(() => {
    if (!query) return;
    const parts = query.split(/\s+(?:and|or|vs|,)\s+|\s+/i).filter((p) => p.length > 2);
    if (parts.length >= 2) {
      fetch(`/mw/interaction?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.severity && d.severity !== "None") {
            setInteractionData(d);
          } else {
            setInteractionData(null);
          }
        })
        .catch(() => setInteractionData(null));
    } else {
      setInteractionData(null);
    }
  }, [query]);

  function handleToggleSave(result: SearchResult) {
    if (!isLoggedIn) return;
    const alreadySaved = savedUrls.has(result.url);
    if (alreadySaved) {
      removeArticle(result.url);
      setSavedUrls((prev) => {
        const next = new Set(prev);
        next.delete(result.url);
        return next;
      });
    } else {
      saveArticle({
        title: result.title,
        url: result.url,
        description: result.description,
        source: result.sourceLabel,
      });
      setSavedUrls((prev) => new Set(prev).add(result.url));
    }
  }

  function handleDownloadClick() {
    setShowExportModal(true);
  }

  async function handleGenerateReport() {
    setDownloading(true);
    setCompilingStatus("Initializing compilation...");
    
    const reportData: any = {};
    const promises: Promise<any>[] = [];

    if (includeOverview) {
      setCompilingStatus("Fetching clinical AI overview...");
      promises.push(
        fetch(`/mw/overview?q=${encodeURIComponent(query)}`)
          .then((r) => {
            if (!r.ok) throw new Error();
            return r.json();
          })
          .then((d) => {
            reportData.overview = d;
          })
          .catch(() => {})
      );
    }

    if (includeCitations) {
      reportData.citations = results;
    }

    if (includeSymptoms) {
      setCompilingStatus("Compiling symptom analysis...");
      promises.push(
        fetch(`/mw/symptoms?q=${encodeURIComponent(query)}`)
          .then((r) => {
            if (!r.ok) throw new Error();
            return r.json();
          })
          .then((d) => {
            reportData.symptoms = d;
          })
          .catch(() => {})
      );
    }

    if (includeStudy) {
      setCompilingStatus("Compiling study materials...");
      promises.push(
        fetch(`/mw/study?q=${encodeURIComponent(query)}`)
          .then((r) => {
            if (!r.ok) throw new Error();
            return r.json();
          })
          .then((d) => {
            reportData.study = d;
          })
          .catch(() => {})
      );
    }

    if (includeTimeline) {
      setCompilingStatus("Compiling medical milestones...");
      promises.push(
        fetch(`/mw/timeline?q=${encodeURIComponent(query)}`)
          .then((r) => {
            if (!r.ok) throw new Error();
            return r.json();
          })
          .then((d) => {
            reportData.timeline = d;
          })
          .catch(() => {})
      );
    }

    try {
      await Promise.all(promises);
      setCompilingStatus("Generating document...");
      exportMedicalReport(query, reportData);
    } catch (err) {
      console.error(err);
      exportMedicalReport(query, {
        overview: includeOverview ? { intro: `Research report compiled for ${query}.`, sections: [] } : undefined,
        citations: includeCitations ? results : undefined
      });
    } finally {
      setDownloading(false);
      setCompilingStatus(null);
      setShowExportModal(false);
    }
  }

  const tabs = [
    { id: "all", label: "All Results", icon: Search },
    { id: "symptoms", label: "Symptom Analyzer", icon: Activity },
    { id: "study", label: "Study Hub", icon: GraduationCap },
    { id: "compare", label: "Compare", icon: GitCompare },
    { id: "timeline", label: "Timeline", icon: History },
    { id: "journey", label: "Health Journey", icon: Compass },
  ] as const;

  return (
    <div className="flex gap-0 min-h-screen relative">
      {/* Main content */}
      <main
        className="flex-1 min-w-0 transition-all duration-300 bg-slate-50/30"
        style={{ maxWidth: chatOpen ? "calc(100% - 380px)" : "100%" }}
      >
        {/* Navigation Tab Bar */}
        <div className="border-b border-slate-100 bg-white sticky top-[68px] z-30 shadow-sm px-4 sm:px-6">
          <div className="flex items-center justify-between overflow-x-auto gap-4 py-2">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                      active
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions (Report Download) */}
            <button
              onClick={handleDownloadClick}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Download Report
            </button>
          </div>
        </div>

        <div className="max-w-4xl px-4 sm:px-6 py-6 space-y-6">
          {/* Dynamic Drug Interaction Warning */}
          {activeTab === "all" && interactionData && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4 animate-fade-in shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-rose-900 text-sm leading-none uppercase tracking-wide">
                    Critical Interaction Warning
                  </h4>
                  <span className="bg-rose-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase">
                    {interactionData.severity} Severity
                  </span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-light">
                  {interactionData.summary}
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  {interactionData.interactions.map((inter: any, idx: number) => (
                    <div key={idx} className="bg-white/60 text-rose-950 p-2 rounded-lg text-xs font-semibold">
                      {inter.drugs.join(" + ")}: {inter.details}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content Router */}
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* AI Overview */}
              <OverviewCard
                query={query}
                onRelatedQuestions={setRelatedQuestions}
                onDiveDeeper={() => setChatOpen(true)}
              />

              {/* People Also Ask */}
              {relatedQuestions.length > 0 && (
                <RelatedQuestions questions={relatedQuestions} />
              )}

              {/* Results */}
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  About {searchData.totalResults} results for &ldquo;{query}&rdquo;
                </p>
                <ResultsList
                  results={results}
                  query={query}
                  isLoggedIn={isLoggedIn}
                  savedUrls={savedUrls}
                  onToggleSave={handleToggleSave}
                />
              </div>

              {/* Bottom Dive Deeper CTA */}
              {!chatOpen && (
                <div className="p-5 bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-semibold text-primary-900 text-sm">Want more detail?</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ask MedAI follow-up questions about {query}
                    </p>
                  </div>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-full transition-all duration-200 active:scale-95 shrink-0 ml-4 shadow"
                  >
                    <Brain className="w-4 h-4" />
                    Dive Deeper
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "symptoms" && <SymptomChecker query={query} />}

          {activeTab === "study" && <StudyHub query={query} />}

          {activeTab === "compare" && <DiseaseCompare query={query} />}

          {activeTab === "timeline" && <TimelineView query={query} />}

          {activeTab === "journey" && <LearningPath query={query} />}
        </div>
      </main>

      {/* AI Chat Panel */}
      {chatOpen && (
        <aside className="w-[380px] shrink-0 border-l border-slate-100 sticky top-0 h-screen overflow-hidden bg-white z-40">
          <AiChatPanel query={query} onClose={() => setChatOpen(false)} />
        </aside>
      )}

      {/* Report Customization Modal */}
      {showExportModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!downloading) setShowExportModal(false);
            }}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Customize Research Report</h3>
                  <p className="text-xs text-slate-400">Select components to compile into your PDF</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={downloading}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Option Items */}
              <div className="space-y-3">
                {/* 1. Clinical Overview */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeOverview}
                    disabled={downloading}
                    onChange={(e) => setIncludeOverview(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      <Brain className="w-3.5 h-3.5 text-primary-600" />
                      Clinical AI Overview
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">AI-generated disease/topic summary & key insights</p>
                  </div>
                </label>

                {/* 2. Citations */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeCitations}
                    disabled={downloading}
                    onChange={(e) => setIncludeCitations(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      <Search className="w-3.5 h-3.5 text-primary-600" />
                      Citations & Bibliography
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">References & source links from medical databases</p>
                  </div>
                </label>

                {/* 3. Symptoms */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSymptoms}
                    disabled={downloading}
                    onChange={(e) => setIncludeSymptoms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Symptom Analysis
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Differential diagnosis mapping based on query terms</p>
                  </div>
                </label>

                {/* 4. Study Guide */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeStudy}
                    disabled={downloading}
                    onChange={(e) => setIncludeStudy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      Study Hub Guide
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Student learning aids, key facts, and mnemonics</p>
                  </div>
                </label>

                {/* 5. Timeline */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeTimeline}
                    disabled={downloading}
                    onChange={(e) => setIncludeTimeline(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      <History className="w-3.5 h-3.5 text-sky-500" />
                      Medical Timeline
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Historical milestones and treatment breakthroughs</p>
                  </div>
                </label>
              </div>

              {/* Status / Error Message */}
              {compilingStatus && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-500 mt-3">
                  <Loader2 className="w-4 h-4 text-primary-700 animate-spin shrink-0" />
                  <span>{compilingStatus}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={downloading}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={downloading || (!includeOverview && !includeCitations && !includeSymptoms && !includeStudy && !includeTimeline)}
                  className="flex-1 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow flex items-center justify-center gap-1.5"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
