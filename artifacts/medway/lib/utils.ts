import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function getDomainName(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getSourceColor(domain: string): string {
  const colors: Record<string, string> = {
    "who.int": "#009EDB",
    "mayoclinic.org": "#BE1337",
    "cdc.gov": "#034C8C",
    "nih.gov": "#1F3366",
    "pubmed.ncbi.nlm.nih.gov": "#336699",
    "medlineplus.gov": "#005F8E",
    "webmd.com": "#B40000",
    "nhs.uk": "#005EB8",
    "healthline.com": "#24A06B",
    "en.wikipedia.org": "#202122",
  };
  for (const [key, val] of Object.entries(colors)) {
    if (domain.includes(key)) return val;
  }
  return "#1d4ed8";
}

export function getSourceInitials(domain: string): string {
  const map: Record<string, string> = {
    "who.int": "W",
    "mayoclinic.org": "MC",
    "cdc.gov": "CDC",
    "nih.gov": "NIH",
    "pubmed.ncbi.nlm.nih.gov": "PM",
    "medlineplus.gov": "ML",
    "webmd.com": "WM",
    "nhs.uk": "NHS",
    "healthline.com": "HL",
    "en.wikipedia.org": "WP",
  };
  for (const [key, val] of Object.entries(map)) {
    if (domain.includes(key)) return val;
  }
  return domain.slice(0, 2).toUpperCase();
}
