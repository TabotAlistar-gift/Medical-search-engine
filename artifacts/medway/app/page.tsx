import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import AccountButton from "@/components/AccountButton";
import { Shield, Zap } from "lucide-react";
import Logo from "@/components/Logo";

const EXAMPLE_SEARCHES = [
  "Type 2 diabetes",
  "Hypertension",
  "Migraine headache",
  "COVID-19 symptoms",
  "Asthma treatment",
  "Depression anxiety",
];

const TRUSTED_BADGES = [
  "WHO",
  "Mayo Clinic",
  "PubMed",
  "CDC",
  "MedlinePlus",
  "NHS",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-bold text-primary-900 text-lg tracking-tight">
            MedWay
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link href="/search?q=symptoms" className="hover:text-primary-700 transition-colors hidden sm:block">
            Symptoms
          </Link>
          <Link href="/search?q=drug+interactions" className="hover:text-primary-700 transition-colors hidden sm:block">
            Medications
          </Link>
          <Link href="/search?q=mental+health" className="hover:text-primary-700 transition-colors hidden sm:block">
            Mental Health
          </Link>
          <AccountButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24 pt-8">
        {/* Logo block */}
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="relative mb-5">
            <Logo size={80} className="drop-shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center shadow-md">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-2">
            <span className="text-primary-700">Med</span>
            <span className="text-teal-600">Way</span>
          </h1>
          <p className="text-slate-500 text-lg font-light">
            Your trusted medical search companion
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-2xl mb-6 animate-slide-up">
          <SearchBar size="large" autoFocus />
        </div>

        {/* Example searches */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl mb-10">
          {EXAMPLE_SEARCHES.map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}`}
              className="px-3 py-1.5 text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-full border border-primary-100 hover:border-primary-200 transition-all duration-150 font-medium"
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Sourced from trusted medical authorities
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TRUSTED_BADGES.map((b) => (
              <span
                key={b}
                className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureItem
            icon={Shield}
            title="Trusted Sources"
            desc="Results from WHO, Mayo Clinic, NIH, CDC, and peer-reviewed journals."
          />
          <FeatureItem
            icon={Zap}
            title="AI Overview"
            desc="Instant AI-generated summaries for every search — clear and accessible."
          />
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
        MedWay is for educational purposes only and does not replace professional medical advice.
      </footer>
    </main>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary-700" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
