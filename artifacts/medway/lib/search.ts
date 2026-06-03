import { searchWikipedia, type WikipediaSearchResult } from "./wikipedia";
import { searchPubMed, type PubMedResult } from "./pubmed";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  sourceLabel: string;
  category: "wikipedia" | "pubmed" | "trusted" | "medlineplus";
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

const TRUSTED_SOURCES = [
  {
    name: "Mayo Clinic",
    label: "mayoclinic.org",
    searchUrl: (q: string) =>
      `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `Find comprehensive information about ${q} symptoms, causes, diagnosis, treatment, and prevention from Mayo Clinic — one of the world's leading medical centers.`,
  },
  {
    name: "World Health Organization",
    label: "who.int",
    searchUrl: (q: string) =>
      `https://www.who.int/search#indexCatalogue=main&searchQuery=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `WHO's global health guidance and research on ${q}, including fact sheets, guidelines, and global statistics.`,
  },
  {
    name: "Centers for Disease Control",
    label: "cdc.gov",
    searchUrl: (q: string) =>
      `https://search.cdc.gov/search/?query=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `CDC health information on ${q} — including prevention, outbreak data, travel health notices, and public health recommendations.`,
  },
  {
    name: "MedlinePlus — NIH",
    label: "medlineplus.gov",
    searchUrl: (q: string) =>
      `https://medlineplus.gov/search/?query=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `Trusted health information from the U.S. National Library of Medicine on ${q} — written for patients and families.`,
  },
  {
    name: "WebMD",
    label: "webmd.com",
    searchUrl: (q: string) =>
      `https://www.webmd.com/search/search_results/default.aspx?query=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `WebMD's symptom checker, drug information, and expert health articles related to ${q}.`,
  },
  {
    name: "NHS Health A-Z",
    label: "nhs.uk",
    searchUrl: (q: string) =>
      `https://www.nhs.uk/search/results?q=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `NHS UK guidance on ${q} — including symptoms, treatments, medicines, and when to seek medical help.`,
  },
  {
    name: "Healthline",
    label: "healthline.com",
    searchUrl: (q: string) =>
      `https://www.healthline.com/search?q1=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `Medically reviewed articles on ${q} from Healthline — covering conditions, nutrition, fitness, and wellness.`,
  },
  {
    name: "PubMed Central — Full Text",
    label: "ncbi.nlm.nih.gov",
    searchUrl: (q: string) =>
      `https://www.ncbi.nlm.nih.gov/pmc/search/?query=${encodeURIComponent(q)}`,
    description: (q: string) =>
      `Free full-text medical and life sciences research articles on ${q} from PubMed Central.`,
  },
];

export async function performSearch(query: string): Promise<SearchResponse> {
  const [wikiResults, pubmedResults] = await Promise.allSettled([
    searchWikipedia(query, 4),
    searchPubMed(query, 3),
  ]);

  const results: SearchResult[] = [];

  // Wikipedia results
  const wiki =
    wikiResults.status === "fulfilled" ? wikiResults.value : [];
  wiki.forEach((r: WikipediaSearchResult, i: number) => {
    results.push({
      id: `wiki-${i}`,
      title: r.title,
      url: r.url,
      description: r.snippet,
      source: "en.wikipedia.org",
      sourceLabel: "Wikipedia",
      category: "wikipedia",
    });
  });

  // Trusted source links (always relevant, query-specific URLs)
  TRUSTED_SOURCES.forEach((s, i) => {
    results.push({
      id: `trusted-${i}`,
      title: `${s.name} — ${query}`,
      url: s.searchUrl(query),
      description: s.description(query),
      source: s.label,
      sourceLabel: s.name,
      category: "trusted",
    });
  });

  // PubMed academic results
  const pubmed =
    pubmedResults.status === "fulfilled" ? pubmedResults.value : [];
  pubmed.forEach((r: PubMedResult, i: number) => {
    results.push({
      id: `pubmed-${i}`,
      title: r.title,
      url: r.url,
      description: `${r.journal}${r.year ? ` (${r.year})` : ""}${r.authors ? ` — ${r.authors}` : ""}`,
      source: "pubmed.ncbi.nlm.nih.gov",
      sourceLabel: "PubMed",
      category: "pubmed",
    });
  });

  return {
    query,
    results,
    totalResults: results.length,
  };
}

export function generateRelatedQuestions(query: string): string[] {
  const q = query.toLowerCase();
  const base = [
    `What are the main symptoms of ${query}?`,
    `How is ${query} diagnosed?`,
    `What are the treatment options for ${query}?`,
    `Is ${query} contagious?`,
    `What causes ${query}?`,
    `How can ${query} be prevented?`,
    `What is the difference between ${query} and related conditions?`,
    `When should I see a doctor about ${query}?`,
    `What medications are used to treat ${query}?`,
    `Are there natural remedies for ${query}?`,
  ];

  // Shuffle deterministically based on query length
  const seed = q.length;
  const shuffled = base
    .map((item, index) => ({ item, sort: (index * seed * 7 + 3) % base.length }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);

  return shuffled.slice(0, 5);
}
