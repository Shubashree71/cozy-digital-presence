import { useSyncExternalStore } from "react";
import type { Role } from "./types";

export interface Session {
  role: Role;
  userId: string; // "ADMIN", a faculty id, or a student id
}

const KEY = "eduguard-session";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Session | null } = { raw: null, value: null };

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cached.raw) {
    try {
      cached = { raw, value: raw ? (JSON.parse(raw) as Session) : null };
    } catch {
      cached = { raw, value: null };
    }
  }
  return cached.value;
}

export function setSession(s: Session | null) {
  if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
  else window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSession,
    () => null,
  );
}
