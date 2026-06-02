import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutGrid,
  Scale,
  Bookmark,
  Sparkles,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";


interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const CLIENT_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/tools", label: "Tools", icon: LayoutGrid },
  { to: "/compare", label: "Compare", icon: Scale },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

function useNavItems() {
  const { user } = useApp();
  const canUseBookmarks = user?.role === "client";
  return canUseBookmarks ? CLIENT_NAV : CLIENT_NAV.filter((n) => n.to !== "/bookmarks");
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const items = useNavItems();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.to}
            to={item.to as "/"}

            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
            title={collapsed ? item.label : undefined}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 -z-10 rounded-xl bg-primary/10 ring-1 ring-primary/30 shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-primary" />
            )}
            <item.icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                active ? "text-primary" : "group-hover:text-foreground"
              }`}
            />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 shrink-0 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">
              AI <span className="text-gradient">Navigator</span>
            </span>
          )}
        </Link>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-6 pb-2 pt-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Navigate
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        <NavLinks collapsed={collapsed} onNavigate={onNavigate} />
      </div>

    </div>
  );
}

export function SidebarNav() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop persistent sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="sticky top-0 z-30 hidden h-screen shrink-0 lg:block"
      >
        <div className="relative h-full border-r border-border/60 bg-sidebar/60 backdrop-blur-xl">
          <SidebarBody collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ChevronLeft
              className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 border-border/60 bg-sidebar p-0 backdrop-blur-xl"
        >
          <SidebarBody
            collapsed={false}
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
