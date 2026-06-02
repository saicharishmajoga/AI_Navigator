import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/contexts/app-context";
import { TOOLS } from "@/lib/mock-data";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Bookmark, Home, LayoutGrid, Scale, Settings } from "lucide-react";

const PAGES = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tools", label: "All Tools", icon: LayoutGrid },
  { to: "/compare", label: "Compare", icon: Scale },
] as const;

export function CommandPalette() {
  const { commandOpen, setCommandOpen, bookmarks, user } = useApp();
  const navigate = useNavigate();

  const go = (to: string) => {
    setCommandOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search tools, pages, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <p.icon className="h-4 w-4 mr-2" /> {p.label}
            </CommandItem>
          ))}
          {user?.role === "client" && (
            <CommandItem onSelect={() => go("/bookmarks")}>
              <Bookmark className="h-4 w-4 mr-2" /> Bookmarks
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="AI Tools">
          {TOOLS.map((t) => (
            <CommandItem
              key={t.slug}
              onSelect={() => {
                setCommandOpen(false);
                navigate({ to: "/tools/$slug", params: { slug: t.slug } });
              }}
            >
              <span className="mr-2 text-lg">{t.logoEmoji}</span>
              <span>{t.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {user?.role === "client" && bookmarks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bookmarks">
              {bookmarks.map((slug) => {
                const t = TOOLS.find((x) => x.slug === slug);
                if (!t) return null;
                return (
                  <CommandItem
                    key={slug}
                    onSelect={() => {
                      setCommandOpen(false);
                      navigate({ to: "/tools/$slug", params: { slug } });
                    }}
                  >
                    <Bookmark className="h-4 w-4 mr-2 text-primary" />
                    {t.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
