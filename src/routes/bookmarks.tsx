import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bookmark, Compass } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { TOOLS } from "@/lib/mock-data";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Your Bookmarks — AI Navigator" },
      { name: "description", content: "Your saved AI tools collection." },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user, bookmarks, setAuthModalOpen } = useApp();
  const saved = TOOLS.filter((t) => bookmarks.includes(t.slug));
  const canView = user?.role === "client";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">Saved</p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Bookmarks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your personal collection of AI tools.</p>
      </div>

      {!canView ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center rounded-2xl p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Bookmark className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">Sign in to save tools</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create a free account to bookmark tools and access them anywhere.
          </p>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="mt-6 border-0 bg-gradient-primary text-primary-foreground"
          >
            Sign in
          </Button>
        </motion.div>
      ) : saved.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center rounded-2xl p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Compass className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">No bookmarks yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Browse the directory and tap the bookmark icon to save tools here.
          </p>
          <Button asChild className="mt-6 border-0 bg-gradient-primary text-primary-foreground">
            <Link to="/tools">Explore tools</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((t, i) => (
            <ToolCard key={t.slug} tool={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
