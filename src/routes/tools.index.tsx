import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TOOLS, CATEGORIES, type Category } from "@/lib/mock-data";
import { ToolCard } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/tools/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "AI Tools Directory — AI Navigator" },
      { name: "description", content: "Browse and filter the best AI tools, frameworks and platforms." },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const { category, q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q ?? "");
  const [sort, setSort] = useState<"popularity" | "name" | "newest">("popularity");

  const activeCategory = (category as Category | undefined) ?? null;

  const filtered = useMemo(() => {
    let list = [...TOOLS];
    if (activeCategory) list = list.filter((t) => t.category === activeCategory);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (q.length === 1) {
        list = list.filter((t) => t.name.toLowerCase().startsWith(q));
      } else {
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.tagline.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        );
      }
    }
    if (sort === "popularity") list.sort((a, b) => b.popularity - a.popularity);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "newest") list.sort((a, b) => b.releaseYear - a.releaseYear);
    return list;
  }, [activeCategory, query, sort]);

  const setCategory = (cat: Category | null) => {
    navigate({ to: "/tools", search: cat ? { category: cat } : {} });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-primary font-mono uppercase tracking-widest mb-2">Directory</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
          Discover AI tools
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          {filtered.length} curated tools across {CATEGORIES.length} categories.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="mt-8 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, categories…"
            className="pl-9 h-11 bg-card border-border/60"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full lg:w-[180px] h-11 bg-card border-border/60">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Most popular</SelectItem>
            <SelectItem value="name">Alphabetical</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge
          onClick={() => setCategory(null)}
          className={`cursor-pointer transition ${
            !activeCategory ? "bg-gradient-primary text-primary-foreground border-0" : "bg-secondary text-foreground hover:bg-secondary/70"
          }`}
        >
          All
        </Badge>
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            onClick={() => setCategory(activeCategory === cat ? null : cat)}
            className={`cursor-pointer transition gap-1 ${
              activeCategory === cat
                ? "bg-gradient-primary text-primary-foreground border-0"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            }`}
          >
            {cat}
            {activeCategory === cat && <X className="h-3 w-3" />}
          </Badge>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t, i) => (
          <ToolCard key={t.slug} tool={t} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 glass rounded-2xl mt-8">
          <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-semibold text-lg">No tools match your filters</h3>
          <p className="text-sm text-muted-foreground mt-1">Try clearing filters or searching differently.</p>
          <Button
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            variant="outline"
            className="mt-4"
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
