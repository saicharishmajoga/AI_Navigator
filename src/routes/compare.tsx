import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Sparkles, Check, Minus } from "lucide-react";
import { z } from "zod";
import { TOOLS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  tools: z.string().optional(),
});

export const Route = createFileRoute("/compare")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Compare AI Tools — AI Navigator" },
      { name: "description", content: "Compare AI tools side-by-side: features, pros, cons, and AI-generated summaries." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { tools } = Route.useSearch();
  const navigate = useNavigate();

  const selectedSlugs = useMemo<string[]>(() => {
    return (tools ?? "langchain,llamaindex").split(",").filter((s: string) => s.length > 0).slice(0, 4);
  }, [tools]);

  const selected = selectedSlugs.map((s) => TOOLS.find((t) => t.slug === s)).filter((t): t is (typeof TOOLS)[number] => Boolean(t));

  const update = (slugs: string[]) => {
    navigate({ to: "/compare", search: { tools: slugs.join(",") } });
  };

  const addSlot = (slug: string) => {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 4) return;
    update([...selectedSlugs, slug]);
  };

  const remove = (slug: string) => update(selectedSlugs.filter((s) => s !== slug));

  const available = TOOLS.filter((t) => !selectedSlugs.includes(t.slug));

  // Build feature matrix from union
  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    selected.forEach((t) => t.features.forEach((f) => set.add(f)));
    return Array.from(set);
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-primary font-mono uppercase tracking-widest mb-2">Compare</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
          Side-by-side analysis
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Pin up to 4 tools. Compare features, pros, cons, and use cases at a glance.
        </p>
      </motion.div>

      {/* Slots */}
      <div className="mt-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {selected.map((t) => (
          <motion.div
            key={t.slug}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-xl border border-primary/30 bg-card p-5 shadow-glow"
          >
            <button
              onClick={() => remove(t.slug)}
              className="absolute top-2 right-2 h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="text-3xl mb-2">{t.logoEmoji}</div>
            <div className="font-display font-semibold">{t.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t.category}</div>
          </motion.div>
        ))}
        {selected.length < 4 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-5 flex flex-col justify-center">
            <Select onValueChange={addSlot}>
              <SelectTrigger className="border-border/60 bg-transparent">
                <Plus className="h-3.5 w-3.5 mr-1" /> <SelectValue placeholder="Add tool" />
              </SelectTrigger>
              <SelectContent>
                {available.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    <span className="mr-2">{t.logoEmoji}</span> {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selected.length < 2 ? (
        <div className="mt-12 glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Add at least 2 tools to compare.</p>
        </div>
      ) : (
        <>
          {/* AI summary */}
          <div className="mt-10 glass-strong rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-md bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-sm">AI summary</h2>
                  <p className="text-[10px] text-muted-foreground">Generated analysis based on tool profiles</p>
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {selected.map((t) => t.name).join(", ")} are all leading tools in the {selected[0]?.category} space.{" "}
                <strong className="text-foreground">{selected.sort((a, b) => b.popularity - a.popularity)[0].name}</strong> leads on popularity ({selected.sort((a, b) => b.popularity - a.popularity)[0].popularity}/100), making it the safer choice for production. If you prioritize an open ecosystem, look for the tools tagged{" "}
                <em>Open Source</em>. For maximum flexibility, combine a framework like LangChain with a vector DB like Pinecone or Chroma.
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-8 overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40">
                <tr>
                  <th className="text-left p-4 font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-secondary/40">Property</th>
                  {selected.map((t) => (
                    <th key={t.slug} className="text-left p-4 font-display font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.logoEmoji}</span>
                        {t.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Category", (t: typeof TOOLS[0]) => t.category],
                  ["Pricing", (t: typeof TOOLS[0]) => t.pricing],
                  ["Released", (t: typeof TOOLS[0]) => String(t.releaseYear)],
                  ["Popularity", (t: typeof TOOLS[0]) => `${t.popularity}/100`],
                  ["Use cases", (t: typeof TOOLS[0]) => t.useCases.join(", ")],
                ].map(([label, fn]) => (
                  <tr key={label as string} className="border-t border-border/60">
                    <td className="p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider sticky left-0 bg-card">{label as string}</td>
                    {selected.map((t) => (
                      <td key={t.slug} className="p-4 text-foreground/90">{(fn as (t: typeof TOOLS[0]) => string)(t)}</td>
                    ))}
                  </tr>
                ))}

                {/* Features matrix */}
                <tr className="border-t-2 border-border bg-secondary/20">
                  <td colSpan={selected.length + 1} className="p-3 font-display font-semibold text-xs uppercase tracking-wider text-primary">
                    Features
                  </td>
                </tr>
                {allFeatures.map((feat) => (
                  <tr key={feat} className="border-t border-border/60">
                    <td className="p-4 text-foreground/90 sticky left-0 bg-card">{feat}</td>
                    {selected.map((t) => (
                      <td key={t.slug} className="p-4">
                        {t.features.includes(feat) ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pros & Cons */}
          <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
            {selected.map((t) => (
              <div key={t.slug} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{t.logoEmoji}</span>
                  <div className="font-display font-semibold">{t.name}</div>
                </div>
                <h4 className="text-xs uppercase tracking-wider text-primary mb-2 font-mono">Pros</h4>
                <ul className="space-y-1 mb-4 text-sm">
                  {t.pros.map((p) => <li key={p} className="flex gap-2 text-foreground/90"><span className="text-primary">+</span>{p}</li>)}
                </ul>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">Cons</h4>
                <ul className="space-y-1 text-sm">
                  {t.cons.map((c) => <li key={c} className="flex gap-2 text-muted-foreground"><span>−</span>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <Button
            onClick={() => update([])}
            variant="outline"
            className="mt-8 border-border/60"
          >
            Clear comparison
          </Button>
        </>
      )}
    </div>
  );
}
