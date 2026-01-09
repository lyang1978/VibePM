import { NextResponse } from "next/server";
import { getAIConfig, type AIConfig } from "@/lib/ai-config";

interface BrainstormItem {
  id: string;
  content: string;
}

// Call OpenAI API
async function callOpenAI(config: AIConfig, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    "gpt-5.2": "gpt-5.2",
    "gpt-4": "gpt-4",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: modelMap[config.model] || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || "No analysis generated",
    usage: data.usage,
  };
}

// Call Anthropic API
async function callAnthropic(config: AIConfig, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3-haiku": "claude-3-haiku-20240307",
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelMap[config.model] || "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || "No analysis generated",
    usage: data.usage,
  };
}

// Call Google Gemini API
async function callGemini(config: AIConfig, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    "gemini-pro": "gemini-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
  };

  const model = modelMap[config.model] || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API error");
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated",
    usage: null,
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  console.log(`[${requestId}] AI Analysis Request Started`);

  try {
    const body = await request.json();
    const { items } = body as { items: BrainstormItem[] };

    if (!items || items.length === 0) {
      console.log(`[${requestId}] Error: No items provided`);
      return NextResponse.json(
        { error: "No items provided for analysis" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Items to analyze: ${items.length}`);
    items.forEach((item, idx) => {
      console.log(`[${requestId}]   ${idx + 1}. ${item.content.slice(0, 50)}${item.content.length > 50 ? '...' : ''}`);
    });

    // Get AI configuration from settings (with env fallback)
    const config = await getAIConfig();
    if (!config) {
      console.log(`[${requestId}] Error: No API key configured`);
      return NextResponse.json(
        { error: "No API key configured. Add one in Settings or set environment variable." },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Using provider: ${config.provider}, model: ${config.model}`);

    const brainstormText = items
      .map((item, index) => `${index + 1}. ${item.content}`)
      .join("\n");

    const systemPrompt = `You are a creative product advisor and implementation strategist. The user has brainstormed some ideas and needs your help to:

1. Analyze and understand the core concept(s)
2. Flesh out the ideas with additional suggestions and improvements
3. Provide a clear implementation roadmap

Format your response as follows:

## Analysis
[Brief analysis of the brainstormed ideas - what's good, what could be clarified]

## Enhanced Ideas
[Expand on the original ideas with creative additions, features, or angles they might not have considered]

## Implementation Roadmap
[Step-by-step practical guide to implement these ideas, broken into phases]

Be concise but thorough. Focus on actionable advice.`;

    const userPrompt = `Here are my brainstormed ideas:\n\n${brainstormText}\n\nPlease analyze these ideas, suggest enhancements, and provide an implementation roadmap.`;

    console.log(`[${requestId}] Calling ${config.provider} API...`);

    const apiStartTime = Date.now();
    let result: { content: string; usage: unknown };

    switch (config.provider) {
      case "openai":
        result = await callOpenAI(config, systemPrompt, userPrompt);
        break;
      case "anthropic":
        result = await callAnthropic(config, systemPrompt, userPrompt);
        break;
      case "google":
        result = await callGemini(config, systemPrompt, userPrompt);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    const apiDuration = Date.now() - apiStartTime;

    console.log(`[${requestId}] API Response:`);
    console.log(`[${requestId}]   Duration: ${apiDuration}ms`);

    // Log usage statistics if available
    if (result.usage) {
      console.log(`[${requestId}] Token Usage:`, JSON.stringify(result.usage));
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] Analysis completed successfully`);
    console.log(`[${requestId}]   Response length: ${result.content.length} chars`);
    console.log(`[${requestId}]   Total duration: ${totalDuration}ms`);

    return NextResponse.json({
      originalItems: items,
      analysis: result.content,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Failed to analyze ideas (${totalDuration}ms):`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze ideas" },
      { status: 500 }
    );
  }
}
