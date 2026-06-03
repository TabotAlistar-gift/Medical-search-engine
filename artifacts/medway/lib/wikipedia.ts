export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
  url: string;
}

export interface WikipediaSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

const WIKI_BASE = "https://en.wikipedia.org";

export async function searchWikipedia(
  query: string,
  limit = 4
): Promise<WikipediaSearchResult[]> {
  try {
    const url = new URL(`${WIKI_BASE}/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srlimit", String(limit));
    url.searchParams.set("srprop", "snippet|titlesnippet");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "MedWay/1.0 (medical search engine)" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.query?.search ?? [];

    return results.map(
      (r: { title: string; snippet: string; pageid: number }) => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]+>/g, ""),
        pageid: r.pageid,
        url: `${WIKI_BASE}/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      })
    );
  } catch {
    return [];
  }
}

export async function getWikipediaSummary(
  title: string
): Promise<WikipediaSummary | null> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, "_"));
    const res = await fetch(
      `${WIKI_BASE}/api/rest_v1/page/summary/${encoded}`,
      {
        headers: {
          "User-Agent": "MedWay/1.0 (medical search engine)",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getWikipediaSummaryForQuery(
  query: string
): Promise<string> {
  const results = await searchWikipedia(query, 1);
  if (!results.length) return "";
  const summary = await getWikipediaSummary(results[0].title);
  return summary?.extract ?? "";
}
