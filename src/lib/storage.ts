// Lightweight typed localStorage helpers (SSR-safe).

const isBrowser = typeof window !== "undefined";

export function readLS<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export const LS_KEYS = {
  auth: "ain.auth.v1",
  bookmarks: "ain.bookmarks.v1",
  visited: "ain.visited.v1",
  threads: "ain.chat.threads.v1",
  theme: "ain.theme.v1",
} as const;
