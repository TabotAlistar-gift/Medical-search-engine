/**
 * lib/auth.ts
 * Lightweight localStorage-based authentication for MedWay.
 * No backend required — name + 4-digit PIN only.
 */

const USER_KEY = "medway_user";
const SESSION_KEY = "medway_session";

export interface MedwayUser {
  id: string;
  name: string;
  pin: string; // stored as plain 4-digit string (local app, no sensitive data)
  createdAt: string;
}

/** Generate a simple unique ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Get all registered users from localStorage */
function getAllUsers(): MedwayUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save users list to localStorage */
function saveUsers(users: MedwayUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

/**
 * Create a new account.
 * Returns the new user on success, or an error string on failure.
 */
export function createAccount(
  name: string,
  pin: string
): { user: MedwayUser } | { error: string } {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Please enter your name." };
  if (pin.length !== 4 || !/^\d{4}$/.test(pin))
    return { error: "PIN must be exactly 4 digits." };

  const users = getAllUsers();

  // Check for duplicate name (case-insensitive)
  const exists = users.find(
    (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) return { error: `An account with the name "${trimmedName}" already exists.` };

  const newUser: MedwayUser = {
    id: generateId(),
    name: trimmedName,
    pin,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  setSession(newUser);
  return { user: newUser };
}

/**
 * Sign in to an existing account.
 * Returns the user on success, or an error string on failure.
 */
export function signIn(
  name: string,
  pin: string
): { user: MedwayUser } | { error: string } {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Please enter your name." };
  if (pin.length !== 4) return { error: "Please enter your 4-digit PIN." };

  const users = getAllUsers();
  const user = users.find(
    (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (!user) return { error: `No account found with the name "${trimmedName}".` };
  if (user.pin !== pin) return { error: "Incorrect PIN. Please try again." };

  setSession(user);
  return { user };
}

/** Set the current session (active user) */
export function setSession(user: MedwayUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/** Get the current logged-in user, or null if not logged in */
export function getSession(): MedwayUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Sign out the current user */
export function signOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

/** Check if a user is currently logged in */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}
