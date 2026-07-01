"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  size?: "large" | "normal";
  autoFocus?: boolean;
}

export default function SearchBar({
  initialQuery = "",
  size = "normal",
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (val: string) => {
    if (val.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/mw/suggestions?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch { /* ignore */ }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const doSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    setIsLoading(true);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || !suggestions.length) {
      if (e.key === "Enter") doSearch(query);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        setQuery(suggestions[activeIndex]);
        doSearch(suggestions[activeIndex]);
      } else {
        doSearch(query);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const isLarge = size === "large";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={cn(
          "relative flex items-center bg-white border-2 transition-all duration-200 group",
          isLarge
            ? "rounded-full border-slate-200 shadow-md hover:shadow-lg"
            : "rounded-full border-slate-200 shadow-sm hover:shadow-md",
          "focus-within:border-primary-600 focus-within:shadow-lg"
        )}
      >
        <Search
          className={cn(
            "absolute left-4 text-slate-400 group-focus-within:text-primary-600 transition-colors hidden sm:block",
            isLarge ? "w-5 h-5 left-5" : "w-4 h-4"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="Search medical topics…"
          className={cn(
            "flex-1 min-w-0 w-full bg-transparent outline-none text-slate-800 placeholder-slate-400",
            isLarge ? "py-4 pl-4 sm:pl-14 pr-4 text-lg" : "py-3 pl-4 sm:pl-11 pr-4 text-base"
          )}
          aria-label="Medical search"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          role="combobox"
        />

        {query && (
          <button
            onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => doSearch(query)}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center gap-2 mr-2 rounded-full font-semibold text-white transition-all duration-200 shrink-0",
            "bg-primary-700 hover:bg-primary-800 active:scale-95",
            "disabled:opacity-70 disabled:cursor-not-allowed",
            isLarge 
              ? "text-base px-4 sm:px-6 py-2.5 h-12 w-12 sm:w-auto" 
              : "text-sm px-2 sm:px-5 py-2 h-8 w-8 sm:w-auto"
          )}
        >
          {isLoading ? (
            <span className="inline-flex gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          ) : (
            <>
              <Search className="w-4 h-4 sm:hidden block shrink-0" />
              <span className="hidden sm:block">Search</span>
            </>
          )}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); setQuery(s); doSearch(s); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex items-center gap-3 w-full px-5 py-3 text-left text-sm transition-colors",
                i === activeIndex
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
