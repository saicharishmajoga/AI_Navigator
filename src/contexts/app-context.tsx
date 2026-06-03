import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LS_KEYS, readLS, writeLS } from "@/lib/storage";
import * as authApi from "@/lib/api/auth";

export type Role = "client" | "guest";

export interface User {
  id: number | string;
  email: string;
  name: string;
  role: Role;
}

interface AppContextValue {
  user: User | null;
  authToken: string | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string) => Promise<any>;
  verifyCode: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  requestReset: (email: string) => Promise<any>;
  verifyResetCode: (email: string, code: string) => Promise<void>;
  resetNewPassword: (email: string, code: string, password: string) => Promise<void>;
  signInGoogle: (email: string, name: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => void;

  bookmarks: string[];
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;

  visited: string[];
  markVisited: (slug: string) => void;

  theme: "dark" | "light";
  toggleTheme: () => void;

  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}



const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    const session = readLS<{ token: string; user: User } | null>(LS_KEYS.auth, null);
    if (session && session.token && session.user) {
      setUser(session.user);
      setAuthToken(session.token);
      void authApi.fetchMe(session.token).then(setUser).catch(() => {
        setUser(null);
        setAuthToken(null);
      });
    }

    setBookmarks(readLS<string[]>(LS_KEYS.bookmarks, []));
    setVisited(readLS<string[]>(LS_KEYS.visited, []));
    const t = readLS<"dark" | "light">(LS_KEYS.theme, "dark");
    setTheme(t);
    document.documentElement.classList.toggle("light", t === "light");
    setHydrated(true);
  }, []);


  // Persist
  useEffect(() => writeLS(LS_KEYS.auth, user && authToken ? { token: authToken, user } : null), [user, authToken]);
  useEffect(() => writeLS(LS_KEYS.bookmarks, bookmarks), [bookmarks]);
  useEffect(() => writeLS(LS_KEYS.visited, visited), [visited]);
  useEffect(() => {
    writeLS(LS_KEYS.theme, theme);
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authToken,
      hydrated,

      signIn: async (email, password) => {
        const tokenResponse = await authApi.login(email, password);
        if ((tokenResponse as any).status === "otp_required") {
          throw new Error(`OTP_REQUIRED:${(tokenResponse as any).otp_code || ""}`);
        }
        const account = await authApi.fetchMe(tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);
        setUser(account);
      },

      registerUser: async (email, password, name) => {
        return await authApi.register(email, password, name);
      },

      verifyCode: async (email, code) => {
        const tokenResponse = await authApi.verifyEmailCode(email, code);
        const account = await authApi.fetchMe(tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);
        setUser(account);
      },

      resendCode: async (email) => {
        await authApi.resendOTP(email);
      },

      requestReset: async (email) => {
        return await authApi.forgotPassword(email);
      },

      verifyResetCode: async (email, code) => {
        const tokenResponse = await authApi.verifyResetOTP(email, code);
        const account = await authApi.fetchMe(tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);
        setUser(account);
      },

      resetNewPassword: async (email, code, password) => {
        await authApi.resetPassword(email, code, password);
      },

      signInGoogle: async (email, name) => {
        const tokenResponse = await authApi.signInWithGoogle(email, name);
        const account = await authApi.fetchMe(tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);
        setUser(account);
      },

      signInGuest: async () => {
        const tokenResponse = await authApi.signInAsGuest();
        const account = await authApi.fetchMe(tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);
        setUser(account);
      },

      signOut: () => {
        setUser(null);
        setAuthToken(null);
      },

      bookmarks,
      toggleBookmark: (slug) =>
        setBookmarks((b) => (b.includes(slug) ? b.filter((s) => s !== slug) : [...b, slug])),
      isBookmarked: (slug) => bookmarks.includes(slug),

      visited,
      markVisited: (slug) =>
        setVisited((v) => (v.includes(slug) ? v : [...v, slug])),

      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),

      authModalOpen,
      setAuthModalOpen,
      commandOpen,
      setCommandOpen,
      sidebarOpen,
      setSidebarOpen,
    }),
    [user, authToken, bookmarks, visited, theme, authModalOpen, commandOpen, sidebarOpen, hydrated],

  );


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
