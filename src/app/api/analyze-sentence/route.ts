import { NextRequest, NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 800;

/**
 * POST /api/analyze-sentence
 * Body: { text: string }
 * Response: { analysis: SentenceAnalysis } | { error: string }
 *
 * Calls DeepSeek to produce a structural breakdown of a complex English sentence.
 * Requires DEEPSEEK_API_KEY environment variable.
 */
export async function POST(request: NextRequest) {
  let text: string;
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY not configured" },
      { status: 503 }
    );
  }

  const truncated = text.slice(0, MAX_TEXT_LENGTH);

  const prompt =
    `Analyze the following complex English sentence and return a JSON object with:\n` +
    `- subject: main subject\n` +
    `- predicate: main verb/predicate\n` +
    `- object: main object (empty string if none)\n` +
    `- clauses: list of objects with 'type' (relative/adverbial/nominal/subject/object/complement/appositive/participial/infinitive/prepositional) and 'text'\n` +
    `- structure_note: brief Chinese explanation of the grammatical structure\n` +
    `- translation: accurate Chinese translation\n\n` +
    `Sentence: ${truncated}\n\n` +
    `Respond with valid JSON only, no markdown fences.`;

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are an expert English grammar analyst. Return only valid JSON, no markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[analyze-sentence] DeepSeek API error:", err);
      return NextResponse.json(
        { error: "DeepSeek API error" },
        { status: 502 }
      );
    }

    const data = await resp.json();
    let raw: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences if present
    if (raw.startsWith("```")) {
      const lines = raw.split("\n");
      const end = lines[lines.length - 1].trim() === "```" ? -1 : undefined;
      raw = lines.slice(1, end).join("\n");
    }

    const analysis = JSON.parse(raw);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[analyze-sentence] Error:", err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 502 }
    );
  }
}
