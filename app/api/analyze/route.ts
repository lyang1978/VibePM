import { NextResponse } from "next/server";

interface BrainstormItem {
  id: string;
  content: string;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  console.log(`[${requestId}] OpenAI Analysis Request Started`);

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log(`[${requestId}] Error: OpenAI API key not configured`);
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

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

    const requestBody = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    console.log(`[${requestId}] Calling OpenAI API...`);
    console.log(`[${requestId}]   Model: ${requestBody.model}`);
    console.log(`[${requestId}]   Temperature: ${requestBody.temperature}`);
    console.log(`[${requestId}]   Max tokens: ${requestBody.max_tokens}`);

    const apiStartTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    const apiDuration = Date.now() - apiStartTime;

    console.log(`[${requestId}] OpenAI API Response:`);
    console.log(`[${requestId}]   Status: ${response.status} ${response.statusText}`);
    console.log(`[${requestId}]   Duration: ${apiDuration}ms`);

    if (!response.ok) {
      const error = await response.json();
      console.error(`[${requestId}] OpenAI API Error:`, JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to analyze ideas" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || "No analysis generated";

    // Log usage statistics
    if (data.usage) {
      console.log(`[${requestId}] Token Usage:`);
      console.log(`[${requestId}]   Prompt tokens: ${data.usage.prompt_tokens}`);
      console.log(`[${requestId}]   Completion tokens: ${data.usage.completion_tokens}`);
      console.log(`[${requestId}]   Total tokens: ${data.usage.total_tokens}`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] Analysis completed successfully`);
    console.log(`[${requestId}]   Response length: ${analysis.length} chars`);
    console.log(`[${requestId}]   Total duration: ${totalDuration}ms`);

    return NextResponse.json({
      originalItems: items,
      analysis,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Failed to analyze ideas (${totalDuration}ms):`, error);
    return NextResponse.json(
      { error: "Failed to analyze ideas" },
      { status: 500 }
    );
  }
}
