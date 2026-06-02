import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppProvider } from "@/contexts/app-context";
import { ChatProvider } from "@/contexts/chat-context";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopHeader } from "@/components/top-header";
import { Footer } from "@/components/footer";
import { FloatingChatbot } from "@/components/floating-chatbot";
import { AuthModal } from "@/components/auth-modal";
import { CommandPalette } from "@/components/command-palette";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 grid-bg">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold font-display">Lost in latent space</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for has drifted off the manifold.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-xl font-display font-semibold">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Navigator — Discover, Compare & Learn AI Tools" },
      { name: "description", content: "A premium AI-native learning platform to intelligently navigate the AI tools ecosystem." },
      { name: "author", content: "AI Navigator" },
      { property: "og:title", content: "AI Navigator" },
      { property: "og:description", content: "Discover, compare and learn AI tools with an intelligent assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ChatProvider>
          <AppLayout />
          <AuthModal />
          <CommandPalette />
          <Toaster theme="dark" position="bottom-center" />
        </ChatProvider>

      </AppProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  return (
    <div className="relative flex min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-hero" />
      <SidebarNav />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <FloatingChatbot />

    </div>
  );
}

