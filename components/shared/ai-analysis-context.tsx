"use client";

import * as React from "react";

interface QuickCaptureItem {
  id: string;
  content: string;
  projectId: string | null;
  createdAt: string;
}

interface AIAnalysisContextType {
  droppedItems: QuickCaptureItem[];
  addItem: (item: QuickCaptureItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const AIAnalysisContext = React.createContext<AIAnalysisContextType | null>(null);

export function AIAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [droppedItems, setDroppedItems] = React.useState<QuickCaptureItem[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  const addItem = React.useCallback((item: QuickCaptureItem) => {
    setDroppedItems((prev) => {
      // Don't add duplicates
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setDroppedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearItems = React.useCallback(() => {
    setDroppedItems([]);
  }, []);

  return (
    <AIAnalysisContext.Provider
      value={{ droppedItems, addItem, removeItem, clearItems, isDragging, setIsDragging }}
    >
      {children}
    </AIAnalysisContext.Provider>
  );
}

export function useAIAnalysis() {
  const context = React.useContext(AIAnalysisContext);
  if (!context) {
    throw new Error("useAIAnalysis must be used within AIAnalysisProvider");
  }
  return context;
}
