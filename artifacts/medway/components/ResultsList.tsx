import { ExternalLink, BookOpen, Globe, FlaskConical } from "lucide-react";
import { getDomainName, getSourceColor, getSourceInitials, truncate } from "@/lib/utils";
import type { SearchResult } from "@/lib/search";

interface ResultsListProps {
  results: SearchResult[];
  query: string;
}

const categoryIcon = {
  wikipedia: BookOpen,
  trusted: Globe,
  pubmed: FlaskConical,
  medlineplus: BookOpen,
};

const categoryLabel = {
  wikipedia: "Encyclopedia",
  trusted: "Trusted Source",
  pubmed: "Research",
  medlineplus: "Health Info",
};

function FaviconBadge({ source, domain }: { source: string; domain: string }) {
  const color = getSourceColor(domain);
  const initials = getSourceInitials(domain);
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded text-white text-[9px] font-bold shrink-0"
      style={{ backgroundColor: color }}
      title={source}
    >
      {initials}
    </span>
  );
}

export default function ResultsList({ results, query }: ResultsListProps) {
  if (!results.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg mb-2">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-sm">Try different keywords or a more specific medical term.</p>
      </div>
    );
  }

  // Group results by category for visual separation
  const wikis = results.filter((r) => r.category === "wikipedia");
  const trusted = results.filter((r) => r.category === "trusted");
  const pubmed = results.filter((r) => r.category === "pubmed");

  return (
    <div className="space-y-6">
      {/* Wikipedia results */}
      {wikis.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Wikipedia
            </span>
          </div>
          <div className="space-y-1">
            {wikis.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* Trusted medical sources */}
      {trusted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Trusted Medical Sources
            </span>
          </div>
          <div className="space-y-1">
            {trusted.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* PubMed research */}
      {pubmed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Research Articles — PubMed
            </span>
          </div>
          <div className="space-y-1">
            {pubmed.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const domain = getDomainName(result.url);
  const Icon = categoryIcon[result.category];

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="result-card block px-4 py-4 rounded-xl border border-transparent hover:border-slate-100 group"
    >
      {/* Source breadcrumb */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <FaviconBadge source={result.sourceLabel} domain={domain} />
        <span className="text-xs text-slate-500">{domain}</span>
        <span className="text-slate-300">›</span>
        <span className="text-xs text-slate-400 truncate max-w-xs">{result.title}</span>
        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors ml-auto shrink-0" />
      </div>

      {/* Title */}
      <h3 className="text-primary-700 font-medium text-base group-hover:underline leading-snug mb-1">
        {result.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {truncate(result.description, 200)}
      </p>

      {/* Category badge */}
      <div className="mt-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-teal-600" />
        <span className="text-[11px] text-teal-700 font-medium">
          {categoryLabel[result.category]}
        </span>
      </div>
    </a>
  );
}
