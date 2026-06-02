import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bookmark, ArrowUpRight, Sparkles } from "lucide-react";
import type { AITool } from "@/lib/mock-data";
import { useApp } from "@/contexts/app-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  tool: AITool;
  index?: number;
}

export function ToolCard({ tool, index = 0 }: Props) {
  const { isBookmarked, toggleBookmark, visited, user, setAuthModalOpen } = useApp();
  const bookmarked = isBookmarked(tool.slug);
  const wasVisited = Boolean(user) && visited.includes(tool.slug);
  const canBookmark = user?.role === "client";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        to="/tools/$slug"
        params={{ slug: tool.slug }}
        className="block relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 h-full transition-all hover:border-primary/40 hover:shadow-glow"
      >
        {/* gradient hover */}
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg glass flex items-center justify-center text-2xl">
              {tool.logoEmoji}
            </div>
            <div>
              <h3 className="font-display font-semibold text-base leading-tight flex items-center gap-2">
                {tool.name}
                {wasVisited && (
                  <span className="text-[10px] text-primary border border-primary/40 rounded-full px-1.5 py-0.5 font-sans font-normal">
                    Visited
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.category}</p>
            </div>
          </div>
          {canBookmark ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleBookmark(tool.slug);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Bookmark"
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {tool.tagline}
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-border/60">
            {tool.pricing}
          </Badge>
          {tool.popularity >= 90 && (
            <Badge className="text-[10px] bg-gradient-primary text-primary-foreground border-0 gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Popular
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-primary"
                style={{ width: `${tool.popularity}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{tool.popularity}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 group-hover:text-primary -mr-2"
            asChild
          >
            <span>
              Learn more <ArrowUpRight className="h-3 w-3" />
            </span>
          </Button>
        </div>
      </Link>
    </motion.div>
  );
}
