import { NextRequest, NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 600;

/**
 * POST /api/translate
 * Body: { text: string }
 * Response: { translation: string }
 *
 * Uses DeepSeek if DEEPSEEK_API_KEY is set in env, otherwise Google Translate (free).
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

  const truncated = text.slice(0, MAX_TEXT_LENGTH);

  // ── Try DeepSeek first if API key is configured ───────────────────────────
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const resp = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
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
                  "You are a professional English-to-Chinese translator. Translate accurately and naturally.",
              },
              {
                role: "user",
                content: `Translate to Simplified Chinese. Output only the translation, no explanations:\n\n${truncated}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 800,
          }),
        }
      );
      const data = await resp.json();
      const translation: string | undefined =
        data?.choices?.[0]?.message?.content?.trim();
      if (translation) {
        return NextResponse.json({ translation });
      }
    } catch (err) {
      console.error("[translate] DeepSeek error, falling back:", err);
    }
  }

  // ── Fallback: Google Translate (unofficial endpoint, free, no key needed) ──
  try {
    const url = new URL(
      "https://translate.googleapis.com/translate_a/single"
    );
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", "zh-CN");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", truncated);

    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await resp.json();
    const translation = (data[0] as [string, unknown][])
      .map((seg) => seg[0] ?? "")
      .join("");
    return NextResponse.json({ translation });
  } catch (err) {
    console.error("[translate] Google Translate error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 502 }
    );
  }
}
