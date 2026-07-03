"use client";

import { useEffect, useState } from "react";
import OverviewCard from "@/components/OverviewCard";
import RelatedQuestions from "@/components/RelatedQuestions";
import ResultsList from "@/components/ResultsList";
import SymptomChecker from "@/components/SymptomChecker";
import StudyHub from "@/components/StudyHub";
import DiseaseCompare from "@/components/DiseaseCompare";
import { exportMedicalReport } from "@/lib/reportExporter";
import {
  Brain,
  Search,
  Activity,
  GraduationCap,
  GitCompare,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import type { SearchResponse, SearchResult } from "@/lib/search";
import { useAuth } from "@/context/AuthContext";
import { saveSearch, saveArticle, removeArticle, isArticleSaved } from "@/lib/userStore";

interface SearchClientProps {
  searchData: SearchResponse;
}

type TabType = "all" | "symptoms" | "study" | "compare";

export default function SearchClient({ searchData }: SearchClientProps) {
  const { isLoggedIn } = useAuth();
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [downloading, setDownloading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(false);
  const [includeStudy, setIncludeStudy] = useState(false);

  const [compilingStatus, setCompilingStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<"patient" | "clinician" | null>(null); // initialized to null to prevent SSR mismatch

  const { query, results } = searchData;

  // Load selection from localStorage on client side mount & sync custom events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medway-user-mode");
      setMode(saved === "clinician" ? "clinician" : "patient");
    }

    const handleSyncMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setMode(customEvent.detail);
      }
    };
    window.addEventListener("medway-mode-change", handleSyncMode);
    return () => window.removeEventListener("medway-mode-change", handleSyncMode);
  }, []);

  function handleModeChange(newMode: "patient" | "clinician") {
    setMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("medway-user-mode", newMode);
      window.dispatchEvent(new CustomEvent("medway-mode-change", { detail: newMode }));
    }
  }

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
    
    // Open the print window immediately to bypass the browser popup blocker
    let printWindow: Window | null = null;
    if (typeof window !== "undefined") {
      printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Generating Report...</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  color: #334155;
                  background-color: #f8fafc;
                }
                .spinner {
                  border: 4px solid #e2e8f0;
                  border-top: 4px solid #0d9488;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite;
                  margin-bottom: 20px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                h2 { margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a; }
                p { margin: 0; font-size: 14px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <h2>Compiling Medical Report</h2>
              <p>Fetching clinical data and preparing your PDF. Please wait...</p>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

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



    try {
      await Promise.all(promises);
      setCompilingStatus("Generating document...");
      exportMedicalReport(query, reportData, printWindow);
    } catch (err) {
      console.error(err);
      exportMedicalReport(query, {
        overview: includeOverview ? { intro: `Research report compiled for ${query}.`, sections: [] } : undefined,
        citations: includeCitations ? results : undefined
      }, printWindow);
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
  ] as const;

  return (
    <div className="flex gap-0 min-h-screen relative">
      {/* Main content */}
      <main className="flex-1 min-w-0 bg-slate-50/30">
        {/* Navigation Tab Bar */}
        <div className="border-b border-slate-100 bg-white sticky top-[68px] z-30 shadow-sm px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2">
            <nav className="flex gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto">
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

            {/* Mode Switcher & Download Report Actions */}
            <div className="flex items-center justify-end gap-3 shrink-0 w-full md:w-auto">
              {mode !== null && (
                <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => handleModeChange("patient")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      mode === "patient"
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    👤 Patient
                  </button>
                  <button
                    onClick={() => handleModeChange("clinician")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      mode === "clinician"
                        ? "bg-primary-700 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🩺 Clinician
                  </button>
                </div>
              )}

              <button
                onClick={handleDownloadClick}
                disabled={downloading}
                className="flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0 shadow-sm"
              >
                {downloading ? (
                  <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
                )}
                Download Report
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl px-4 sm:px-6 py-6 space-y-6">


          {/* Tab Content Router */}
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* AI Overview */}
              {mode !== null && (
                <OverviewCard
                  query={query}
                  mode={mode}
                  onRelatedQuestions={setRelatedQuestions}
                />
              )}

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

            </div>
          )}

          {activeTab === "symptoms" && mode !== null && <SymptomChecker query={query} mode={mode} />}

          {activeTab === "study" && <StudyHub query={query} />}

          {activeTab === "compare" && <DiseaseCompare query={query} />}


        </div>
      </main>

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
                  disabled={downloading || (!includeOverview && !includeCitations && !includeSymptoms && !includeStudy)}
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
