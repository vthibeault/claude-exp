'use client';

import Link from 'next/link';
import { Moon, Sun, Settings, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useCommandSearch } from '@/hooks/use-command-search';

export function Topbar() {
  const { setTheme, theme } = useTheme();
  const { open } = useCommandSearch();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
          PS
        </div>
        <span className="font-semibold text-sm hidden sm:inline">
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'PS Project Manager'}
        </span>
      </Link>

      <div className="flex-1" />

      <button
        onClick={open}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-48 justify-between"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Rechercher…
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          ⌘K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <Button variant="ghost" size="icon" asChild>
        <Link href="/settings" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </header>
  );
}
