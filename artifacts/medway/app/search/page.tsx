import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Logo from "@/components/Logo";
import SearchClient from "./SearchClient";
import { performSearch } from "@/lib/search";
import { isMedicalQuery } from "@/lib/medicalGuard";
import AccountButton from "@/components/AccountButton";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `${q} — MedWay` : "Search — MedWay",
    description: q
      ? `Medical search results for "${q}" from trusted sources including WHO, Mayo Clinic, PubMed, and more.`
      : "Search MedWay for trusted medical information.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No search query provided.</p>
          <Link
            href="/"
            className="text-primary-700 hover:underline text-sm font-medium"
          >
            ← Back to MedWay
          </Link>
        </div>
      </div>
    );
  }

  // ── Medical-only guard ─────────────────────────────────────────────────
  if (!isMedicalQuery(query)) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Reuse the same sticky header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo size={24} />
              <span className="font-bold text-primary-900 text-base tracking-tight hidden sm:block">
                MedWay
              </span>
            </Link>
            <div className="flex-1 max-w-3xl">
              <SearchBar initialQuery={query} />
            </div>
          </div>
        </header>

        {/* Non-medical rejection message */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            MedWay is a Medical Search Engine
          </h2>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
            Your search <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span> doesn&apos;t
            appear to be related to medicine or health. MedWay only searches trusted
            medical sources — please try a health or medical topic.
          </p>
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-widest">Try a medical search like:</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {["Diabetes symptoms", "Hypertension treatment", "Migraine causes", "Asthma medications", "COVID-19"].map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="px-3 py-1.5 text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-full border border-primary-100 transition-all font-medium"
              >
                {s}
              </Link>
            ))}
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-primary-700 hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to MedWay
          </Link>
        </main>

        <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-100 bg-white">
          MedWay — For educational purposes only. Always consult a healthcare professional.
        </footer>
      </div>
    );
  }

  const searchData = await performSearch(query);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Logo size={24} />
            <span className="font-bold text-primary-900 text-base tracking-tight hidden sm:block">
              MedWay
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-3xl">
            <SearchBar initialQuery={query} />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 shrink-0">
            <AccountButton />
            <Link
              href="/"
              className="sm:hidden p-2 text-slate-500 hover:text-primary-700 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Client-side interactive content */}
      <div className="flex-1">
        <SearchClient searchData={searchData} />
      </div>

      <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-100 bg-white">
        MedWay — For educational purposes only. Always consult a healthcare professional for medical advice.
      </footer>
    </div>
  );
}
