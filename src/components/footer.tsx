import { Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold">
                AI <span className="text-gradient">Navigator</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Intelligently navigate the AI tools ecosystem. Discover, compare, and learn — with an
              AI assistant by your side.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/tools" className="hover:text-foreground transition">All Tools</Link></li>
              <li><Link to="/compare" className="hover:text-foreground transition">Comparison</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} AI Navigator. Premium AI learning platform.</span>
          <span>Built with care for the AI community.</span>
        </div>
      </div>
    </footer>
  );
}
