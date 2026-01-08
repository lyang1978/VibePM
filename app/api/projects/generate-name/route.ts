import { NextResponse } from "next/server";

interface GenerateNameRequest {
  currentName: string;
  problem: string | null;
}

export async function POST(request: Request) {
  try {
    const body: GenerateNameRequest = await request.json();
    const { currentName, problem } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a creative naming expert. Generate a single creative, catchy project name (2-4 words max).

Rules:
- Make it memorable and cool-sounding, like a startup name or brand
- Avoid generic descriptions - be creative and evocative
- Can use single powerful words like "Vortex", "Nimbus", "Ember", "Pulse"
- Can combine words creatively like "SkyForge", "CodePulse", "NightOwl"
- The name should subtly relate to the project's purpose but not be a literal description
- NO quotes, NO explanations - just output the name itself

Examples of good names:
- "Vortex" for a data pipeline tool
- "Ember" for a notification system
- "SkyForge" for a cloud deployment tool
- "Axiom" for a testing framework
- "Nimbus" for a file storage app`;

    const userPrompt = `Current project name: ${currentName}
${problem ? `Project description: ${problem}` : "No description available."}

Generate a creative name for this project.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate name" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedName = data.choices[0]?.message?.content?.trim() || currentName;

    // Clean up any quotes that might be in the response
    const cleanName = generatedName.replace(/["']/g, "").trim();

    return NextResponse.json({ name: cleanName });
  } catch (error) {
    console.error("Error generating name:", error);
    return NextResponse.json(
      { error: "Failed to generate name" },
      { status: 500 }
    );
  }
}
