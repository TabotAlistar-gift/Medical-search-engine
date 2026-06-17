"use client";

import { useEffect, useState } from "react";
import { X, History, Bookmark, Search, Trash2, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import {
  getSearchHistory,
  getSavedArticles,
  clearHistory,
  removeArticle,
  getFolders,
  createFolder,
  deleteFolder,
  saveArticleToFolder,
  type SearchHistoryItem,
  type SavedArticle,
} from "@/lib/userStore";
import { useAuth } from "@/context/AuthContext";

type Tab = "history" | "saved";

interface AccountDashboardProps {
  defaultTab?: Tab;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

import { FolderPlus, Trash, ChevronRight, Folder } from "lucide-react";

export default function AccountDashboard({
  defaultTab = "history",
  onClose,
}: AccountDashboardProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [saved, setSaved] = useState<SavedArticle[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [newFolderInput, setNewFolderInput] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Load data fresh when opening
  useEffect(() => {
    setHistory(getSearchHistory());
    setSaved(getSavedArticles());
    setFolders(getFolders());
  }, []);

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleRemoveArticle(url: string) {
    removeArticle(url);
    setSaved((prev) => prev.filter((a) => a.url !== url));
  }

  function handleCreateFolder() {
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;
    createFolder(trimmed);
    setFolders(getFolders());
    setNewFolderInput("");
    setIsCreatingFolder(false);
  }

  function handleDeleteFolder(name: string) {
    if (confirm(`Are you sure you want to delete folder "${name}"? Articles within it will be untagged.`)) {
      deleteFolder(name);
      setFolders(getFolders());
      setSaved(getSavedArticles());
      if (selectedFolder === name) {
        setSelectedFolder("All");
      }
    }
  }

  function handleAssignFolder(article: SavedArticle, folderName: string) {
    saveArticleToFolder(article, folderName);
    setSaved(getSavedArticles());
  }

  const filteredArticles = selectedFolder === "All"
    ? saved
    : saved.filter((a) => a.folder === selectedFolder);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-800 text-base">My Research Workspace</p>
            <p className="text-xs text-slate-400">Researcher: {user?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setTab("history")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              tab === "history"
                ? "text-primary-700 border-primary-600 bg-white"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Recent Search
          </button>
          <button
            onClick={() => setTab("saved")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              tab === "saved"
                ? "text-primary-700 border-primary-600 bg-white"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved Topics
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Recent Searches ── */}
          {tab === "history" && (
            <div className="p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No search history</p>
                  <p className="text-xs mt-1">Queries you explore will be tracked here.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {history.length} recent queries
                    </p>
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {history.map((item, i) => (
                      <li key={i}>
                        <Link
                          href={`/search?q=${encodeURIComponent(item.query)}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/20 group transition-all"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 group-hover:text-primary-700 truncate font-medium">
                            {item.query}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                            <Clock className="w-3 h-3" />
                            {timeAgo(item.timestamp)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* ── Saved Articles (Research Folders) ── */}
          {tab === "saved" && (
            <div className="p-4 space-y-4">
              {/* Folders Management Tab */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Research Folders</h4>
                  <button
                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                    className="flex items-center gap-1 text-[10px] text-primary-700 hover:underline font-bold uppercase"
                  >
                    <FolderPlus className="w-3 h-3" />
                    New Folder
                  </button>
                </div>

                {isCreatingFolder && (
                  <div className="flex gap-1.5 p-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <input
                      type="text"
                      value={newFolderInput}
                      onChange={(e) => setNewFolderInput(e.target.value)}
                      placeholder="Folder name"
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 outline-none flex-1 focus:border-primary-500 text-slate-800"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="bg-primary-700 text-white text-[10px] font-semibold px-3 py-1 rounded-lg hover:bg-primary-800"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Folder Selectors */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedFolder("All")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedFolder === "All"
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    All Bookmarks ({saved.length})
                  </button>
                  {folders.map((f) => (
                    <div key={f} className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedFolder(f)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedFolder === f
                            ? "bg-primary-700 border-primary-700 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <Folder className="w-3 h-3 shrink-0" />
                        {f} ({saved.filter((s) => s.folder === f).length})
                      </button>
                      {f !== "General" && f !== "Cardiology" && f !== "Neurology" && f !== "Pediatrics" && (
                        <button
                          onClick={() => handleDeleteFolder(f)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Delete folder"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookmarked articles list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedFolder} Bookmarks ({filteredArticles.length})
                </h4>

                {filteredArticles.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No bookmarks in {selectedFolder}</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredArticles.map((article, i) => (
                      <li
                        key={i}
                        className="rounded-2xl border border-slate-200/70 p-4 hover:border-primary-100 hover:bg-primary-50/10 transition-all group relative space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mb-1">
                              {article.source}
                            </span>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-bold text-slate-800 hover:text-primary-700 hover:underline leading-snug block"
                            >
                              {article.title}
                            </a>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {article.description}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white border border-slate-100 shadow-sm transition-colors"
                              title="Visit Original Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleRemoveArticle(article.url)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 shadow-sm transition-colors"
                              title="Delete bookmark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Folder Assign Selector */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-400 font-medium">Folder:</span>
                          <select
                            value={article.folder || "General"}
                            onChange={(e) => handleAssignFolder(article, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 focus:border-primary-500 outline-none"
                          >
                            {folders.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
