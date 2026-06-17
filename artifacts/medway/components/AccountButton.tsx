"use client";

import { useRef, useState } from "react";
import {
  UserCircle2,
  LogOut,
  History,
  Bookmark,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import AccountDashboard from "./AccountDashboard";

type DashboardTab = "history" | "saved";

export default function AccountButton() {
  const { user, isLoggedIn, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("history");
  const dropdownRef = useRef<HTMLDivElement>(null);

  function openDashboard(tab: DashboardTab) {
    setDashboardTab(tab);
    setShowDashboard(true);
    setShowDropdown(false);
  }

  function handleSignOut() {
    signOut();
    setShowDropdown(false);
  }

  // ── Guest state ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <div className="relative group">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-full transition-all duration-200 active:scale-95 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Account</span>
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute right-0 top-full mt-2 w-52 bg-slate-900 text-white text-xs rounded-xl px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
            <span className="text-teal-300 font-semibold block mb-0.5">🔓 Unlock more features</span>
            Save searches, bookmark articles, download history & more
            {/* Arrow */}
            <span className="absolute -top-1.5 right-5 w-3 h-3 bg-slate-900 rotate-45 rounded-sm" />
          </div>
        </div>

        {showModal && (
          <AuthModal defaultMode="create" onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  // ── Logged-in state ──────────────────────────────────────────────────────────
  const initial = user!.name.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
          aria-label="Account menu"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initial}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">
            {user!.name}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user!.name}
                  </p>
                  <p className="text-xs text-slate-400">MedWay Account</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => openDashboard("history")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  Recent Searches
                </button>
                <button
                  onClick={() => openDashboard("saved")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  Saved Articles
                </button>
              </div>

              <div className="border-t border-slate-100 py-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account dashboard panel */}
      {showDashboard && (
        <AccountDashboard
          defaultTab={dashboardTab}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </>
  );
}
