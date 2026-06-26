/**
 * lib/userStore.ts
 * localStorage store for per-user data:
 * — search history, saved articles
 */

import { getSession } from "./auth";

const MAX_HISTORY = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchHistoryItem {
  query: string;
  timestamp: string; // ISO string
}

export interface SavedArticle {
  title: string;
  url: string;
  description: string;
  source: string;
  savedAt: string; // ISO string
  folder?: string; // Optional folder category
}

export interface QuizScore {
  topic: string;
  correct: number;
  total: number;
  timestamp: string; // ISO string
}



// ── Helpers ───────────────────────────────────────────────────────────────────

function historyKey(userId: string): string {
  return `medway_history_${userId}`;
}

function savedKey(userId: string): string {
  return `medway_saved_${userId}`;
}

function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return getSession()?.id ?? null;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Search History ────────────────────────────────────────────────────────────

/** Save a search query to the current user's history */
export function saveSearch(query: string): void {
  const uid = currentUserId();
  if (!uid || !query.trim()) return;

  const key = historyKey(uid);
  const history = readJSON<SearchHistoryItem[]>(key, []);

  // Remove duplicate if exists, then prepend
  const filtered = history.filter(
    (h) => h.query.toLowerCase() !== query.toLowerCase()
  );
  const updated: SearchHistoryItem[] = [
    { query: query.trim(), timestamp: new Date().toISOString() },
    ...filtered,
  ].slice(0, MAX_HISTORY);

  writeJSON(key, updated);
}

/** Get the current user's search history */
export function getSearchHistory(): SearchHistoryItem[] {
  const uid = currentUserId();
  if (!uid) return [];
  return readJSON<SearchHistoryItem[]>(historyKey(uid), []);
}

/** Clear the current user's search history */
export function clearHistory(): void {
  const uid = currentUserId();
  if (!uid) return;
  localStorage.removeItem(historyKey(uid));
}

// ── Saved Articles ────────────────────────────────────────────────────────────

/** Save an article to the current user's favourites */
export function saveArticle(article: Omit<SavedArticle, "savedAt">): void {
  const uid = currentUserId();
  if (!uid) return;

  const key = savedKey(uid);
  const saved = readJSON<SavedArticle[]>(key, []);

  // Avoid duplicates by URL
  if (saved.some((a) => a.url === article.url)) return;

  const updated: SavedArticle[] = [
    { ...article, savedAt: new Date().toISOString() },
    ...saved,
  ];
  writeJSON(key, updated);
}

/** Remove a saved article by URL */
export function removeArticle(url: string): void {
  const uid = currentUserId();
  if (!uid) return;

  const key = savedKey(uid);
  const saved = readJSON<SavedArticle[]>(key, []);
  writeJSON(
    key,
    saved.filter((a) => a.url !== url)
  );
}

/** Get all saved articles for the current user */
export function getSavedArticles(): SavedArticle[] {
  const uid = currentUserId();
  if (!uid) return [];
  return readJSON<SavedArticle[]>(savedKey(uid), []);
}

/** Check if an article is already saved */
export function isArticleSaved(url: string): boolean {
  return getSavedArticles().some((a) => a.url === url);
}

// ── Folder Management ─────────────────────────────────────────────────────────

function foldersKey(userId: string): string {
  return `medway_folders_${userId}`;
}

export function getFolders(): string[] {
  const uid = currentUserId();
  if (!uid) return [];
  return readJSON<string[]>(foldersKey(uid), ["General", "Cardiology", "Neurology", "Pediatrics"]);
}

export function createFolder(name: string): void {
  const uid = currentUserId();
  if (!uid) return;
  const key = foldersKey(uid);
  const current = getFolders();
  if (current.includes(name)) return;
  writeJSON(key, [...current, name]);
}

export function deleteFolder(name: string): void {
  const uid = currentUserId();
  if (!uid) return;
  const key = foldersKey(uid);
  const current = getFolders();
  writeJSON(key, current.filter(f => f !== name));

  // Untag saved articles from this folder
  const articlesKey = savedKey(uid);
  const saved = getSavedArticles();
  const updated = saved.map(a => a.folder === name ? { ...a, folder: undefined } : a);
  writeJSON(articlesKey, updated);
}

export function saveArticleToFolder(article: Omit<SavedArticle, "savedAt">, folderName: string): void {
  const uid = currentUserId();
  if (!uid) return;
  const key = savedKey(uid);
  const saved = getSavedArticles();
  
  // If article exists, update its folder, else insert
  const idx = saved.findIndex(a => a.url === article.url);
  if (idx > -1) {
    saved[idx].folder = folderName;
    writeJSON(key, [...saved]);
  } else {
    const updated: SavedArticle[] = [
      { ...article, folder: folderName, savedAt: new Date().toISOString() },
      ...saved
    ];
    writeJSON(key, updated);
  }
}

// ── Quiz Scores ────────────────────────────────────────────────────────────────

function quizKey(userId: string): string {
  return `medway_quiz_${userId}`;
}

export function getQuizScores(): QuizScore[] {
  const uid = currentUserId();
  if (!uid) return [];
  return readJSON<QuizScore[]>(quizKey(uid), []);
}

export function saveQuizScore(topic: string, correct: number, total: number): void {
  const uid = currentUserId();
  if (!uid) return;
  const key = quizKey(uid);
  const current = getQuizScores();
  const updated = [
    { topic, correct, total, timestamp: new Date().toISOString() },
    ...current
  ];
  writeJSON(key, updated);
}


