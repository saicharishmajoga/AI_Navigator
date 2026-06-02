import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Brain, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Navigator — Intelligently navigate the AI ecosystem" },
      { name: "description", content: "Discover, learn, and compare AI tools with a premium learning platform and AI assistant." },
    ],
  }),
  component: Home,
});

function Home() {
  const { setOpen } = useChat();

  return (
    <div className="w-full relative min-h-screen">
      {/* Seamless background grid and ambient glows across the whole page */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] bg-primary/15 blur-[140px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-24 left-1/3 -translate-x-1/3 h-[500px] w-[800px] bg-accent/8 blur-[130px] rounded-full -z-10 pointer-events-none" />

      {/* HERO */}
      <section className="relative pt-20 pb-20 sm:pt-32 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-center text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Navigate the <span className="text-gradient">AI ecosystem</span><br className="hidden sm:block" />
            with intelligence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-center text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover, learn, and compare AI tools — from LLM frameworks to vector databases.
            With an AI assistant that adapts to wherever you are on the platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 h-12 px-6 shadow-glow">
              <Link to="/tools">
                Explore tools <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOpen(true)}
              className="h-12 px-6 border-border/60 glass"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask the assistant
            </Button>
          </motion.div>
        </div>
      </section>

      {/* WHY US */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 relative">
        <div className="text-center mb-12">
          <p className="text-xs text-primary font-mono uppercase tracking-widest mb-2">Why AI Navigator</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">Built for AI practitioners</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: Brain, title: "AI-native learning", body: "Each tool page is curated like a tutorial — not a sales pitch." },
            { icon: Zap, title: "Context-aware assistant", body: "The chatbot adapts its suggestions to whichever tool you're exploring." },
            { icon: Search, title: "Deep, focused content", body: "Documentation, FAQs, use cases — without the noise." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/40 bg-background p-6 hover:shadow-glow hover:border-primary/30 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
