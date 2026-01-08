import { NextResponse } from "next/server";

interface GenerateRequest {
  captureId: string;
  content: string;
  analysis: string;
  userAnswers?: {
    question: string;
    answer: string;
  }[];
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  hint: string;
}

interface GenerateResponse {
  suggestedName: string;
  suggestedProblem: string;
  suggestedMvp: string;
  clarifyingQuestions: ClarifyingQuestion[];
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  console.log(`[${requestId}] Promote to Project - Generate Started`);

  try {
    const body: GenerateRequest = await request.json();
    const { captureId, content, analysis, userAnswers } = body;

    if (!captureId || !content) {
      return NextResponse.json(
        { error: "captureId and content are required" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Capture ID: ${captureId}`);
    console.log(`[${requestId}] Content length: ${content.length}`);
    console.log(`[${requestId}] Analysis length: ${analysis?.length || 0}`);
    console.log(`[${requestId}] User answers: ${userAnswers?.length || 0}`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log(`[${requestId}] Error: OpenAI API key not configured`);
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a product strategist helping convert brainstormed ideas into well-defined project specifications.

Given a user's raw idea and AI analysis, generate:
1. A concise project name (3-5 words max)
2. A clear problem statement (what problem does this solve?)
3. An MVP definition in MoSCoW format (Must Have, Should Have, Could Have, Won't Have)
4. 2-3 clarifying questions to help refine the project scope

${userAnswers && userAnswers.length > 0 ? `
The user has provided additional context through these Q&A:
${userAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}

Use these answers to improve your suggestions.
` : ""}

Respond in JSON format ONLY (no markdown, no code blocks):
{
  "suggestedName": "Project Name Here",
  "suggestedProblem": "Problem statement here...",
  "suggestedMvp": "## Must Have\\n- Feature 1\\n- Feature 2\\n\\n## Should Have\\n- Feature 3\\n\\n## Could Have\\n- Feature 4\\n\\n## Won't Have (v1)\\n- Feature 5",
  "clarifyingQuestions": [
    {
      "id": "q1",
      "question": "What is your target audience?",
      "hint": "This helps define features and complexity"
    }
  ]
}`;

    const userPrompt = `Raw Idea:
${content}

${analysis ? `AI Analysis:
${analysis}` : "No AI analysis available yet."}

Generate project suggestions based on this idea.`;

    const requestBody = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    };

    console.log(`[${requestId}] Calling OpenAI API...`);
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
    console.log(`[${requestId}] OpenAI Response: ${response.status} (${apiDuration}ms)`);

    if (!response.ok) {
      const error = await response.json();
      console.error(`[${requestId}] OpenAI API Error:`, JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to generate project suggestions" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    // Log token usage
    if (data.usage) {
      console.log(`[${requestId}] Tokens: ${data.usage.total_tokens}`);
    }

    // Parse JSON response
    let suggestions: GenerateResponse;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      suggestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse JSON:`, responseText);
      // Fallback with defaults
      suggestions = {
        suggestedName: "New Project",
        suggestedProblem: content,
        suggestedMvp: "## Must Have\n- Core feature\n\n## Should Have\n- Secondary feature",
        clarifyingQuestions: [
          {
            id: "q1",
            question: "What is the main goal of this project?",
            hint: "Helps define the core scope",
          },
        ],
      };
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] Generation completed (${totalDuration}ms)`);

    return NextResponse.json(suggestions);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Error (${totalDuration}ms):`, error);
    return NextResponse.json(
      { error: "Failed to generate project suggestions" },
      { status: 500 }
    );
  }
}
