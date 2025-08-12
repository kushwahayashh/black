"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Globe, Star, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useTransition, useCallback, useRef } from "react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>("");
  const showVideoSearch = pathname?.startsWith("/videos");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize query from URL params only once
  useEffect(() => {
    if (!showVideoSearch) return;
    const current = searchParams.get("q") ?? "";
    setQuery(current);
  }, [showVideoSearch, searchParams]);

  // Optimized debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      const qs = params.toString();
      
      startTransition(() => {
        router.replace(qs ? `/videos?${qs}` : "/videos", { scroll: false });
      });
    }, 300); // Slightly longer debounce for better UX
  }, [router, startTransition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  const isActive = (href: string) => (pathname === href || pathname?.startsWith(href + "/"));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold leading-none">Video</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              aria-current={isActive("/") ? "page" : undefined}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : ""}`}
            >
              <Globe className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link
              href="/videos"
              aria-current={isActive("/videos") ? "page" : undefined}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${isActive("/videos") ? "text-primary" : ""}`}
            >
              <Star className="h-4 w-4" />
              <span>Videos</span>
            </Link>
            {showVideoSearch && (
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search videos..."
                    aria-label="Search videos"
                    className="pl-8 h-9"
                  />
                  {query && (
                    <button
                      type="button"
                     onClick={() => handleSearchChange("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <ThemeToggle />
          </nav>

          {/* Mobile Navigation */}
          <nav className="flex items-center space-x-2 md:hidden">
            {showVideoSearch ? (
              <div className="flex-1 max-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search videos..."
                    aria-label="Search videos"
                    className="pl-8 h-9 pr-8"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/videos">
                  <Button variant="ghost" size="icon">
                    <Star className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}