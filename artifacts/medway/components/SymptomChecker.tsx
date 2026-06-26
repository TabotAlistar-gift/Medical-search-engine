"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Activity, 
  Loader2, 
  ChevronRight, 
  FileText, 
  Heart, 
  Stethoscope, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { exportMedicalReport } from "@/lib/reportExporter";

interface Condition {
  name: string;
  likelihood: "High" | "Moderate" | "Low";
  confidenceScore: number;
  explanation: string;
  severityAssessment: "Self-Care" | "Clinic Visit" | "Emergency";
  riskFactors: string[];
  icd10?: string;
}

interface PrimarySpotlight {
  condition: string;
  likelihood: "High" | "Moderate" | "Low";
  confidenceScore: number;
  why: string;
  recommendedNextSteps: string[];
  icd10?: string;
}

interface SymptomData {
  intro: string;
  primarySpotlight?: PrimarySpotlight;
  conditions: Condition[];
  urgencyLevel: "Green" | "Yellow" | "Red";
  redFlags: string[];
  recommendedTests: string[];
  firstAid: string[];
  prevention: string[];
  relatedDiseases: string[];
  warning: string;
}

interface Props {
  query: string;
  mode?: "patient" | "clinician";
}

export default function SymptomChecker({ query, mode = "patient" }: Props) {
  const [symptomsInput, setSymptomsInput] = useState(query || "");
  const [ageInput, setAgeInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [severityInput, setSeverityInput] = useState("");

  const [data, setData] = useState<SymptomData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Sync initial query, but DO NOT auto-trigger the analysis (user starts with empty results)
  useEffect(() => {
    if (query) {
      setSymptomsInput(query);
    }
  }, [query]);

  const triggerAnalysis = (currentMode = mode) => {
    if (!symptomsInput.trim()) return;
    setLoading(true);
    setError(false);
    setData(null);

    const params = new URLSearchParams();
    params.append("symptoms", symptomsInput);
    if (ageInput) params.append("age", ageInput);
    if (genderInput) params.append("gender", genderInput);
    if (durationInput) params.append("duration", durationInput);
    if (severityInput) params.append("severity", severityInput);
    if (currentMode) params.append("mode", currentMode);

    fetch(`/mw/symptoms?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d: SymptomData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  };

  // Re-run symptom checker automatically on mode change IF results are already visible
  useEffect(() => {
    if (data && !loading) {
      triggerAnalysis(mode);
    }
  }, [mode]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAnalysis();
  };

  const handleDownload = () => {
    if (!data) return;
    exportMedicalReport(symptomsInput, {
      symptoms: {
        intro: data.intro,
        conditions: data.conditions.map(c => ({
          name: c.name,
          likelihood: c.likelihood,
          explanation: `${c.explanation} (Confidence: ${c.confidenceScore}%, Triage: ${c.severityAssessment})`
        })),
        warning: `${data.warning}\n\nRecommended Tests:\n${data.recommendedTests.map(t => `- ${t}`).join("\n")}\n\nSelf Care:\n${data.firstAid.map(t => `- ${t}`).join("\n")}`
      }
    });
  };

  const badgeColors = {
    High: "bg-rose-50 border border-rose-200 text-rose-700",
    Moderate: "bg-amber-50 border border-amber-200 text-amber-700",
    Low: "bg-blue-50 border border-blue-200 text-blue-700",
  };

  const severityBadgeColors = {
    "Self-Care": "bg-emerald-50 border border-emerald-200 text-emerald-700",
    "Clinic Visit": "bg-amber-50 border border-amber-200 text-amber-700",
    "Emergency": "bg-rose-50 border border-rose-200 text-rose-700",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. LARGE FULL-WIDTH INPUT FORM CARD */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg md:text-xl">Symptom Triage Assistant</h3>
            <p className="text-xs text-slate-400">Describe your symptoms to generate a customized clinical triage map</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. What symptoms are you experiencing?
            </label>
            <textarea
              required
              rows={4}
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              placeholder="e.g., I have had a high fever for three days, accompanied by a severe headache, stomach discomfort, and general fatigue."
              className="w-full text-base bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-700 font-medium leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Patient Demographics & Severity Details
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Age Range
                </label>
                <select
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-600 font-semibold"
                >
                  <option value="">Not Specified</option>
                  <option value="Child (0-12)">Child (0-12)</option>
                  <option value="Teen (13-17)">Teen (13-17)</option>
                  <option value="Adult (18-64)">Adult (18-64)</option>
                  <option value="Senior (65+)">Senior (65+)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Biological Sex
                </label>
                <select
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-600 font-semibold"
                >
                  <option value="">Not Specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <select
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-600 font-semibold"
                >
                  <option value="">Not Specified</option>
                  <option value="Less than 24 hours">Less than 24h</option>
                  <option value="1-3 days">1-3 Days</option>
                  <option value="4-7 days">4-7 Days</option>
                  <option value="Over a week">Over 1 Week</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Perceived Severity
                </label>
                <select
                  value={severityInput}
                  onChange={(e) => setSeverityInput(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-600 font-semibold"
                >
                  <option value="">Not Specified</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-primary-700 hover:bg-primary-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Checking Symptoms...
                </>
              ) : (
                <>
                  <Activity className="w-4.5 h-4.5" />
                  Check Symptoms
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. RESULTS DISPLAY PANEL (DYNAMICS BELOW INPUTS) */}
      <div className="space-y-6">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[350px] animate-pulse">
            <Loader2 className="w-10 h-10 text-primary-700 animate-spin mb-4" />
            <p className="text-base text-slate-700 font-bold">Analyzing symptoms...</p>
            <p className="text-xs text-slate-400 mt-1">Cross-referencing database details and demographics</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm text-rose-800 font-bold">Analysis currently unavailable.</p>
            <p className="text-xs text-rose-600/80 mt-1">Please try modifying your search inputs and running the triage again.</p>
          </div>
        )}

        {/* Results Data Container */}
        {data && !loading && !error && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Urgency Alert Cards */}
            {data.urgencyLevel === "Red" && (
              <div className="bg-rose-600 border border-rose-700 text-white rounded-3xl p-6 flex items-start gap-4 shadow-md">
                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Critical Emergency Advisory</h4>
                  <p className="text-xs font-light leading-relaxed">
                    Your symptom parameters suggest a critical threat level. If you are experiencing chest pain, respiratory distress, severe abdominal pain, or sudden confusion, please proceed to the nearest emergency clinic or contact emergency services immediately.
                  </p>
                </div>
              </div>
            )}

            {data.urgencyLevel === "Yellow" && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-sm text-amber-900">
                <Stethoscope className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-800">Clinical Evaluation Advised</h4>
                  <p className="text-xs font-medium leading-relaxed text-amber-700">
                    Your symptom indicators show moderate severity. We advise you to schedule a consultation with a primary care practitioner or visit an urgent care clinic in your local area within 24 hours.
                  </p>
                </div>
              </div>
            )}

            {data.urgencyLevel === "Green" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start gap-4 shadow-sm text-emerald-900">
                <Heart className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-emerald-800">Supportive Care & Observation</h4>
                  <p className="text-xs font-medium leading-relaxed text-emerald-700">
                    Your symptoms fall within the supportive care parameter. Focus on adequate hydration, rest, and home monitoring. Check with a local pharmacist or healthcare professional if symptoms persist.
                  </p>
                </div>
              </div>
            )}

            {/* Spotlight Card */}
            {data.primarySpotlight && (
              <div className="bg-gradient-to-br from-primary-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
                <div className="flex items-center gap-1.5 text-xs text-primary-200 font-bold uppercase tracking-wider bg-primary-850/60 px-3 py-1 rounded-full self-start w-fit border border-primary-800/40">
                  <Sparkles className="w-3 h-3" />
                  Primary Diagnosis Hypothesis
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight flex flex-wrap items-center gap-3">
                    <span>Could it be {data.primarySpotlight.condition}?</span>
                    {data.primarySpotlight.icd10 && (
                      <span className="text-xs text-rose-300 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        ICD-10: {data.primarySpotlight.icd10}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${badgeColors[data.primarySpotlight.likelihood]}`}>
                      {data.primarySpotlight.likelihood} Match
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      Confidence Level: <span className="text-primary-300 font-extrabold">{data.primarySpotlight.confidenceScore}%</span>
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-light bg-white/5 border border-white/10 p-5 rounded-2xl">
                  {data.primarySpotlight.why}
                </p>

                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-200">Recommended Next Steps</h4>
                  <ul className="grid gap-2.5">
                    {data.primarySpotlight.recommendedNextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Intro Summary text */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed font-medium">
              {data.intro}
            </div>

            {/* Differential Diagnostics */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Differentials & Matches</h4>
              <div className="grid gap-3">
                {data.conditions.map((c, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-primary-100 transition-all shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-extrabold text-slate-800 text-base">{c.name}</span>
                          {c.icd10 && (
                            <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold uppercase">
                              ICD-10: {c.icd10}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeColors[c.likelihood]}`}>
                            {c.likelihood} Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-light leading-relaxed">{c.explanation}</p>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityBadgeColors[c.severityAssessment]}`}>
                          {c.severityAssessment}
                        </span>
                        <Link
                          href={`/search?q=${encodeURIComponent(c.name)}`}
                          className="flex items-center gap-1 text-[11px] text-primary-700 hover:underline font-bold bg-primary-50 px-3 py-1 rounded-full hover:bg-primary-100 transition-colors"
                        >
                          Explore
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar Confidence Meter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Confidence level</span>
                        <span className="text-slate-600 font-extrabold">{c.confidenceScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-teal-500 rounded-full transition-all duration-500" 
                          style={{ width: `${c.confidenceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {c.riskFactors && c.riskFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">Risk Factors:</span>
                        {c.riskFactors.map((factor, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Care & Guidelines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Recommended Diagnostic Tests */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Stethoscope className="w-4.5 h-4.5 text-primary-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnostic Tests</h4>
                </div>
                <ul className="space-y-2">
                  {data.recommendedTests.map((test, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-primary-700 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{test}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* First Aid & Self-Care */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Heart className="w-4.5 h-4.5 text-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">First Aid & Self-Care</h4>
                </div>
                <ul className="space-y-2">
                  {data.firstAid.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-rose-500 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention Tips */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Prevention Guidelines</h4>
                </div>
                <ul className="space-y-2">
                  {data.prevention.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related exploration */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-purple-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Related Exploration</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.relatedDiseases.map((disease, idx) => (
                    <Link
                      key={idx}
                      href={`/search?q=${encodeURIComponent(disease)}`}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold transition-colors border border-purple-100"
                    >
                      {disease}
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* RED FLAGS BOX */}
            {data.redFlags && data.redFlags.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Critical Red Flag Warning Symptoms</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.redFlags.map((flag, idx) => (
                    <li key={idx} className="text-xs text-rose-700 flex items-start gap-1.5 font-medium">
                      <span className="text-rose-600 shrink-0 mt-0.5">⚠️</span>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ADVISORY FOOTER */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Local Clinical Triage Disclaimer</h5>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  {data.warning}
                </p>
              </div>
            </div>

            {/* DOWNLOAD REPORT ACTION */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <FileText className="w-4.5 h-4.5" />
                Download Symptom Report
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
