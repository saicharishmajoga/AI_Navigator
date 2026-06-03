const getApiBase = () => {
  if (typeof window !== "undefined") {
    // If the browser is accessing the website on Render, automatically route to the production backend!
    if (window.location.hostname.includes("onrender.com")) {
      return "https://ai-navigator-rija.onrender.com";
    }
    // If there is an injected API base on window, try using it if it's not localhost
    if ((window as any).__API_BASE__ && !(window as any).__API_BASE__.includes("localhost")) {
      return (window as any).__API_BASE__;
    }
  }
  return import.meta.env.VITE_API_BASE ?? 
         import.meta.env.VITE_API_URL ?? 
         "http://localhost:8000";
};

const API_BASE = getApiBase();

async function fetchAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
    credentials: "include",
    ...init,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || data?.message || data?.error || response.statusText;
    throw new Error(typeof message === "string" ? message : "Authentication failed");
  }
  return data as T;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
}

export interface AuthUser {
  id: number | string;
  email: string;
  name: string;
  role: "client" | "guest";
}

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  return fetchAuth<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string): Promise<AuthUser> {
  return fetchAuth<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthTokenResponse> {
  return fetchAuth<AuthTokenResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resendOTP(email: string): Promise<{ success: boolean; message: string }> {
  return fetchAuth<{ success: boolean; message: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return fetchAuth<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetOTP(email: string, code: string): Promise<AuthTokenResponse> {
  return fetchAuth<AuthTokenResponse>("/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(email: string, code: string, password: string): Promise<{ success: boolean; message: string }> {
  return fetchAuth<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, password }),
  });
}

export async function fetchMe(token: string): Promise<AuthUser> {
  return fetchAuth<AuthUser>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function signInAsGuest(): Promise<AuthTokenResponse> {
  return fetchAuth<AuthTokenResponse>("/auth/guest", {
    method: "POST",
  });
}

export async function signInWithGoogle(email: string, name: string): Promise<AuthTokenResponse> {
  return fetchAuth<AuthTokenResponse>("/auth/oauth/google", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}
