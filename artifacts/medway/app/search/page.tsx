import Link from "next/link";
import { Stethoscope, ArrowLeft } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import SearchClient from "./SearchClient";
import { performSearch } from "@/lib/search";
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

  const searchData = await performSearch(query);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-primary-900 text-base tracking-tight hidden sm:block">
              MedWay
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl">
            <SearchBar initialQuery={query} />
          </div>

          {/* Back on mobile */}
          <Link
            href="/"
            className="sm:hidden p-2 text-slate-500 hover:text-primary-700 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Tab bar */}
        <div className="px-4 sm:px-6 pb-2 hidden sm:block">
          <nav className="flex gap-4 text-xs text-slate-500">
            <span className="text-primary-700 font-medium border-b-2 border-primary-700 pb-1">
              All Results
            </span>
            <span className="hover:text-primary-700 cursor-pointer pb-1">Research</span>
            <span className="hover:text-primary-700 cursor-pointer pb-1">Wikipedia</span>
            <span className="hover:text-primary-700 cursor-pointer pb-1">Trusted Sources</span>
          </nav>
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
