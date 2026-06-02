import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Menu, Sun, Moon, LogOut, User as UserIcon, Bookmark, Command, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function TopHeader() {
  const {
    user,
    signOut,
    setAuthModalOpen,
    theme,
    toggleTheme,
    setCommandOpen,
    setSidebarOpen,
    bookmarks,
  } = useApp();

  const showBookmarksMenu = user?.role === "client";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHomePage = pathname === "/";
  const isToolsPage = pathname === "/tools" || pathname.startsWith("/tools/");
  const isComparePage = pathname === "/compare" || pathname.startsWith("/compare/");
  const hideSearchAndBorder = isHomePage || isToolsPage || isComparePage;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-20"
    >
      <div className={hideSearchAndBorder ? "bg-transparent border-transparent" : "glass-strong border-b border-border/60"}>
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Mobile menu + brand */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
 
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </Link>
 
          {/* Global search */}
          {!hideSearchAndBorder ? (
            <button
              onClick={() => setCommandOpen(true)}
              className="group ml-1 flex h-9 flex-1 max-w-md items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-secondary/60"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search tools, pages, actions…</span>
              <span className="sm:hidden">Search…</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <span className="hidden text-sm sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-strong">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {showBookmarksMenu && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/bookmarks" className="cursor-pointer">
                          <Bookmark className="mr-2 h-4 w-4" />
                          Bookmarks
                          <span className="ml-auto text-xs text-muted-foreground">{bookmarks.length}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="border-0 bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
