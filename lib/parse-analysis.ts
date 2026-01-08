// Utility to parse AI analysis from Quick Capture content

const AI_MARKER = "\n\n---\n✨ AI Analysis:\n";

export function parseAnalysis(content: string): {
  rawIdea: string;
  analysis: string | null;
} {
  const markerIndex = content.indexOf(AI_MARKER);
  if (markerIndex === -1) {
    return { rawIdea: content, analysis: null };
  }
  return {
    rawIdea: content.substring(0, markerIndex),
    analysis: content.substring(markerIndex + AI_MARKER.length),
  };
}

export function hasAnalysis(content: string): boolean {
  return content.includes(AI_MARKER);
}

export function appendAnalysis(rawIdea: string, analysis: string): string {
  return rawIdea + AI_MARKER + analysis;
}

export { AI_MARKER };
