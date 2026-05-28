import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 10 * 1024 * 1024;

function buildRamsayPrompt(title: string, description: string): string {
  return `You are Gordon Ramsay — the world's most brutally honest Michelin-star chef.

STEP 1 — FOOD DETECTION:
Does this image contain food, a prepared dish, a drink, raw ingredients, or anything edible?
Count as NOT FOOD ONLY IF: person, selfie, pet, landscape, building, car, screenshot, meme, cartoon.
If truly NOT food respond ONLY with: {"notFood": true, "rating": 1, "comment": "That's not food. Get out of my kitchen."}

STEP 2 — CRITIQUE (only if IS food):
Dish: "${title}"${description ? ` — "${description}"` : ""}.
Judge: presentation, plating, colours, textures, portion, composition.
Be BRUTALLY honest. Ramsay voice: "bloody hell", "donkey", "disgrace", "stunning", etc.
Score: 1-3=disaster, 4-5=below average, 6-7=solid home cook, 8-9=impressive, 10=near perfection.
2-3 sentences MAX.

Respond ONLY with valid JSON, no markdown:
{"notFood": false, "rating": <integer 1-10>, "comment": "<critique>"}`;
}

function parseRamsayJSON(text: string): { rating: number; comment: string; notFood?: boolean } {
  const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (parsed.notFood) return { rating: 1, comment: "That's not food. Get out of my kitchen.", notFood: true };
  const rating = Math.min(10, Math.max(1, Math.round(Number(parsed.rating))));
  if (!parsed.comment) throw new Error("No comment in AI response");
  return { rating, comment: String(parsed.comment) };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const title = (formData.get("title") as string | null)?.trim() ?? "Untitled Dish";
  const description = (formData.get("description") as string | null)?.trim() ?? "";

  if (!file || file.size === 0) return NextResponse.json({ error: "No image provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const imgBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(imgBuffer).toString("base64");
  const mimeType = file.type.startsWith("image/") ? file.type : "image/jpeg";
  const prompt = buildRamsayPrompt(title, description);

  // Try Gemini inline (no URL needed — send base64 directly)
  if (geminiKey) {
    try {
      const body = JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 300 },
      });
      const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
      for (const model of models) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(20000) }
        );
        if (r.ok) {
          const data = await r.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const result = parseRamsayJSON(text);
            return NextResponse.json(result);
          }
        }
        if (r.status === 429 && groqKey) break;
        if (r.status !== 429) break;
      }
    } catch (err) {
      console.error("[rate-guest] Gemini error:", err);
      if (!groqKey) {
        return NextResponse.json({ rating: 5, comment: "My AI critic is temporarily unavailable. Based on appearances, this looks like it needs work." });
      }
    }
  }

  // Groq fallback — needs a data URL since it accepts image_url
  if (groqKey) {
    try {
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const body = JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: dataUrl } }, { type: "text", text: prompt }] }],
        temperature: 0.9,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body,
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return NextResponse.json(parseRamsayJSON(text));
      }
    } catch (err) {
      console.error("[rate-guest] Groq error:", err);
    }
  }

  // Last-resort fallback
  const fallbacks = [
    { rating: 5, comment: "Bloody hell, I couldn't get a proper look at this. Visually though — it needs serious help." },
    { rating: 6, comment: "Something went wrong in my kitchen brain. From what I can see, it's passable — barely." },
  ];
  return NextResponse.json(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
}
