"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createAccount as authCreate,
  signIn as authSignIn,
  signOut as authSignOut,
  getSession,
  type MedwayUser,
} from "@/lib/auth";

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: MedwayUser | null;
  isLoggedIn: boolean;
  createAccount: (
    name: string,
    pin: string
  ) => { user: MedwayUser } | { error: string };
  signIn: (
    name: string,
    pin: string
  ) => { user: MedwayUser } | { error: string };
  signOut: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  createAccount: () => ({ error: "Not initialised" }),
  signIn: () => ({ error: "Not initialised" }),
  signOut: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MedwayUser | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setUser(getSession());
  }, []);

  const createAccount = useCallback(
    (name: string, pin: string) => {
      const result = authCreate(name, pin);
      if ("user" in result) setUser(result.user);
      return result;
    },
    []
  );

  const signIn = useCallback((name: string, pin: string) => {
    const result = authSignIn(name, pin);
    if ("user" in result) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(() => {
    authSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        createAccount,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
