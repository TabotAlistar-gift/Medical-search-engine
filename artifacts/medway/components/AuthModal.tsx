"use client";

import { useEffect, useRef, useState } from "react";
import { X, Delete, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

type Mode = "create" | "signin";

interface AuthModalProps {
  defaultMode?: Mode;
  onClose: () => void;
}

const PIN_LENGTH = 4;
const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function AuthModal({ defaultMode = "create", onClose }: AuthModalProps) {
  const { createAccount, signIn } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, [mode]);

  // Reset state when switching modes
  function switchMode(m: Mode) {
    setMode(m);
    setPin("");
    setError("");
    setSuccess("");
  }

  function handleDigit(digit: string) {
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!digit) return;
    if (pin.length >= PIN_LENGTH) return;
    setPin((p) => p + digit);
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      nameRef.current?.focus();
      return;
    }
    if (pin.length < PIN_LENGTH) {
      setError("Please enter your 4-digit PIN.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 300)); // brief visual delay

    const result =
      mode === "create"
        ? createAccount(name.trim(), pin)
        : signIn(name.trim(), pin);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      setPin("");
    } else {
      setSuccess(
        mode === "create"
          ? `Welcome to MedWay, ${result.user.name}! 🎉`
          : `Welcome back, ${result.user.name}! 👋`
      );
      setTimeout(() => onClose(), 1200);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[320px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-teal-600 px-5 pt-6 pb-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
            <Logo size={22} />
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === "create" ? "Create Account" : "Sign In"}
          </h2>
          <p className="text-white/80 text-[11px] mt-0.5 max-w-[220px] mx-auto leading-normal">
            {mode === "create"
              ? "Unlock search history & saved articles"
              : "Welcome back to MedWay"}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-0.5 mt-3 bg-white/15 rounded-lg p-0.5">
            <button
              onClick={() => switchMode("create")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mode === "create"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => switchMode("signin")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mode === "signin"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-10 h-10 text-teal-500" />
              <p className="text-slate-700 font-semibold text-xs text-center">{success}</p>
            </div>
          ) : (
            <>
              {/* Name input */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="e.g. Alistar"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-300 transition"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {/* PIN display */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {mode === "create" ? "Set a 4-Digit PIN" : "Enter Your PIN"}
                </label>
                <div className="flex gap-2 justify-center mb-2.5">
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                        i < pin.length
                          ? "border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/10"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      {i < pin.length && (
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                      )}
                    </div>
                  ))}
                </div>

                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                  {DIGITS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => handleDigit(d)}
                      disabled={!d && d !== "0"}
                      className={`h-8 rounded-lg text-xs font-semibold transition-all duration-100 active:scale-90 ${
                        d === "⌫"
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : d === ""
                          ? "invisible"
                          : "bg-slate-50 text-slate-700 hover:bg-primary-50 hover:text-primary-700 border border-slate-100/50"
                      }`}
                      aria-label={d === "⌫" ? "Backspace" : d || undefined}
                    >
                      {d === "⌫" ? <Delete className="w-3.5 h-3.5 mx-auto" /> : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 mb-2.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || pin.length < PIN_LENGTH}
                className="w-full py-2 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 active:scale-98 text-xs"
              >
                {loading
                  ? "Please wait…"
                  : mode === "create"
                  ? "Create My Account"
                  : "Sign In"}
              </button>

              <p className="text-center text-[10px] text-slate-400 mt-2">
                Your data stays on this device. No email needed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
