"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b-2 border-foreground bg-card px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or page title can go here */}
      </div>

      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-2 border-foreground"
                onClick={onOpenCommandPalette}
              >
                <Command className="h-4 w-4" />
                <span className="text-sm">Command</span>
                <kbd className="pointer-events-none h-5 select-none rounded border border-foreground/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open command palette</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-2 border-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle dark mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
