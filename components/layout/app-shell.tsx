"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "./command-palette";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Quick shortcuts (when not in an input)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInput) {
        // N: New project
        if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          window.location.href = "/projects/new";
        }

        // C: Quick capture
        if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          // TODO: Open quick capture modal
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
