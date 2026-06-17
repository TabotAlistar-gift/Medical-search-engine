"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, AlertCircle, Lightbulb, FileText, CheckCircle2 } from "lucide-react";

interface StudyNotesData {
  title: string;
  introduction: string;
  epidemiology?: string;
  pathophysiology: string;
  clinicalPresentation: string;
  diagnostics: string;
  treatment: string;
  prognosis: string;
  clinicalPearls: string[];
}

interface Props {
  query: string;
  onStudyComplete?: () => void;
  isCompleted?: boolean;
}

export default function StudyNotes({ query, onStudyComplete, isCompleted }: Props) {
  const [data, setData] = useState<StudyNotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(false);
    setData(null);

    fetch(`/mw/studynotes?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: StudyNotesData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [query]);

  function handlePrint() {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print study notes.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Study Guide - ${data.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #334155;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            h1 { color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 25px; }
            h2 { color: #0f172a; font-size: 18px; margin-top: 30px; border-left: 4px solid #0d9488; padding-left: 10px; }
            p { margin-bottom: 15px; }
            .pearls-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 15px; margin-top: 30px; }
            .pearls-title { font-weight: bold; color: #6d28d9; margin-bottom: 10px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>Study Notes: ${data.title}</h1>
          
          <h2>1. Introduction & Etiology</h2>
          <p>${data.introduction}</p>
          
          ${data.epidemiology ? `<h2>2. Epidemiology & Risk Factors</h2><p>${data.epidemiology}</p>` : ""}
          
          <h2>3. Pathophysiology</h2>
          <p>${data.pathophysiology}</p>
          
          <h2>4. Clinical Presentation & Manifestations</h2>
          <p>${data.clinicalPresentation}</p>
          
          <h2>5. Diagnostic Evaluation</h2>
          <p>${data.diagnostics}</p>
          
          <h2>6. Management & Treatment</h2>
          <p>${data.treatment}</p>
          
          <h2>7. Prognosis & Complications</h2>
          <p>${data.prognosis}</p>
          
          ${
            data.clinicalPearls && data.clinicalPearls.length > 0
              ? `
            <div class="pearls-box">
              <div class="pearls-title">Clinical Pearls & High-Yield Facts</div>
              <ul>
                ${data.clinicalPearls.map((p) => `<li>${p}</li>`).join("")}
              </ul>
            </div>
          `
              : ""
          }
          
          <footer>
            MedWay Academic Resource. Compiled automatically using clinical summaries.
          </footer>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Compiling textbook study notes for &ldquo;{query}&rdquo;...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center my-6">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-800 font-medium">Failed to compile study notes for this topic. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Textbook Title & Print Action */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <BookOpen className="w-5 h-5 text-primary-700" />
          <span>Clinical Reference Textbook</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          Print / Save PDF
        </button>
      </div>

      {/* Textbook Sections Container */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Intro */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            1. Introduction & Clinical Definition
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 rounded-xl border border-slate-100/50">
            {data.introduction}
          </p>
        </section>

        {/* Epidemiology */}
        {data.epidemiology && (
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
              2. Epidemiology & Risk Factors
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
              {data.epidemiology}
            </p>
          </section>
        )}

        {/* Pathophysiology */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            3. Pathophysiology & Mechanism
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
            {data.pathophysiology}
          </p>
        </section>

        {/* Clinical Manifestations */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            4. Clinical Presentation & Symptoms
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
            {data.clinicalPresentation}
          </p>
        </section>

        {/* Diagnostics */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            5. Diagnostic Evaluation & Criteria
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
            {data.diagnostics}
          </p>
        </section>

        {/* Treatment */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            6. Therapeutic Management & Guidelines
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
            {data.treatment}
          </p>
        </section>

        {/* Prognosis */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-700 pl-3">
            7. Prognosis & Potential Complications
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal pl-4">
            {data.prognosis}
          </p>
        </section>

        {/* Clinical Pearls */}
        {data.clinicalPearls && data.clinicalPearls.length > 0 && (
          <section className="bg-violet-50/50 border border-violet-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
              <Lightbulb className="w-4 h-4 text-violet-700 shrink-0" />
              <span>High-Yield Clinical Pearls & Exam Tips</span>
            </div>
            <ul className="space-y-2">
              {data.clinicalPearls.map((pearl, idx) => (
                <li key={idx} className="text-xs text-violet-950 font-medium leading-relaxed list-disc list-inside">
                  {pearl}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Complete Step Action Panel */}
      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          onClick={onStudyComplete}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            isCompleted
              ? "bg-slate-100 hover:bg-slate-200 text-slate-500"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isCompleted ? "Mark Milestone Uncompleted" : "Mark Milestone Completed"}
        </button>
      </div>
    </div>
  );
}
