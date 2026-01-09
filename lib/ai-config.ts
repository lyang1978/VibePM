import { db } from "@/lib/db";

export type AIProvider = "openai" | "anthropic" | "google";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

// Model to provider mapping
const modelProviders: Record<string, AIProvider> = {
  "gpt-5.2": "openai",
  "gpt-4": "openai",
  "gpt-4-turbo": "openai",
  "gpt-4o": "openai",
  "gpt-3.5-turbo": "openai",
  "claude-3-opus": "anthropic",
  "claude-3-sonnet": "anthropic",
  "claude-3-haiku": "anthropic",
  "gemini-pro": "google",
  "gemini-2.5-pro": "google",
  "gemini-2.5-flash": "google",
  "gemini-1.5-pro": "google",
  "gemini-1.5-flash": "google",
};

// Get a setting value from the database
async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await db.appSetting.findUnique({
      where: { key },
    });
    if (setting) {
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Get API key for a provider - settings take priority over env vars
export async function getApiKey(provider: AIProvider): Promise<string | null> {
  switch (provider) {
    case "openai": {
      const settingsKey = await getSetting("openaiApiKey");
      return settingsKey || process.env.OPENAI_API_KEY || null;
    }
    case "anthropic": {
      const settingsKey = await getSetting("anthropicApiKey");
      return settingsKey || process.env.ANTHROPIC_API_KEY || null;
    }
    case "google": {
      const settingsKey = await getSetting("googleApiKey");
      return settingsKey || process.env.GOOGLE_API_KEY || null;
    }
    default:
      return null;
  }
}

// Get the full AI configuration based on settings
export async function getAIConfig(): Promise<AIConfig | null> {
  const model = (await getSetting("defaultAiModel")) || "gpt-4o";
  const provider = modelProviders[model] || "openai";
  const apiKey = await getApiKey(provider);

  if (!apiKey) {
    return null;
  }

  return {
    provider,
    model,
    apiKey,
  };
}

// Get provider from model name
export function getProviderFromModel(model: string): AIProvider {
  return modelProviders[model] || "openai";
}
