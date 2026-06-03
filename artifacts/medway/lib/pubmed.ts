export interface PubMedResult {
  title: string;
  url: string;
  description: string;
  authors: string;
  journal: string;
  year: string;
  pmid: string;
}

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function searchPubMed(
  query: string,
  limit = 4
): Promise<PubMedResult[]> {
  try {
    const searchRes = await fetch(
      `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + "[Title/Abstract]")}&retmax=${limit}&retmode=json&sort=relevance`,
      { next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];
    if (!ids.length) return [];

    const summaryRes = await fetch(
      `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
      { next: { revalidate: 3600 } }
    );
    if (!summaryRes.ok) return [];

    const summaryData = await summaryRes.json();
    const results: PubMedResult[] = [];

    for (const id of ids) {
      const article = summaryData?.result?.[id];
      if (!article) continue;

      const authors = (article.authors ?? [])
        .slice(0, 3)
        .map((a: { name: string }) => a.name)
        .join(", ");

      results.push({
        pmid: id,
        title: article.title ?? "Untitled",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        description:
          article.title +
          (authors ? ` — ${authors}` : "") +
          (article.fulljournalname
            ? `. ${article.fulljournalname}`
            : ""),
        authors,
        journal: article.fulljournalname ?? article.source ?? "",
        year: article.pubdate?.split(" ")?.[0] ?? "",
      });
    }

    return results;
  } catch {
    return [];
  }
}
