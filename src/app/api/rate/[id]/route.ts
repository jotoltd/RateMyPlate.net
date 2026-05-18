import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plateId } = await params;
  const supabase = await createClient();

  // Verify the caller is authenticated (accepts both cookie session and Bearer token)
  const authHeader = request.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    userId = data.user?.id ?? null;
  } else {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the plate — must belong to the caller and have no AI rating yet
  const { data: plate, error: fetchError } = await supabase
    .from("plates")
    .select("id, title, description, image_url, user_id, ai_rating")
    .eq("id", plateId)
    .single();

  if (fetchError || !plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  if (plate.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Already rated — return existing data
  if (plate.ai_rating !== null) {
    return NextResponse.json({ alreadyRated: true }, { status: 200 });
  }

  // Run AI rating
  let aiResult: { rating: number; comment: string; notFood?: boolean };
  try {
    aiResult = await getAIRating(
      plate.image_url,
      plate.title,
      plate.description ?? ""
    );
  } catch {
    const fallbacks = [
      { rating: 5, comment: "Bloody hell, even my camera is refusing to look at this. Could be magnificent, could be a war crime — we'll never know." },
      { rating: 5, comment: "My AI consultant has walked out. On appearances alone though, it looks like it needs help." },
    ];
    aiResult = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  if (aiResult.notFood) {
    await supabase.storage.from("plates").remove([plate.image_url.split("/plates/")[1]]);
    await supabase.from("plates").delete().eq("id", plateId);
    return NextResponse.json({ error: "Not food" }, { status: 422 });
  }

  // Save AI rating and approve the plate
  await supabase
    .from("plates")
    .update({
      ai_rating: aiResult.rating,
      ai_comment: aiResult.comment,
      status: "approved",
    })
    .eq("id", plateId);

  return NextResponse.json({
    rating: aiResult.rating,
    comment: aiResult.comment,
  });
}

// ---- AI helpers (extracted from plates.ts) ----

async function getAIRating(
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return { rating: 5, comment: "Looks edible. Probably." };
  }

  if (geminiKey) {
    try {
      return await rateWithGemini(geminiKey, imageUrl, title, description);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if ((!msg.includes("429") || !groqKey) && !groqKey) throw err;
    }
  }

  return await rateWithGroq(groqKey!, imageUrl, title, description);
}

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

async function rateWithGemini(
  apiKey: string,
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imgBuffer = await imgRes.arrayBuffer();
  const rawMime = imgRes.headers.get("content-type") ?? "image/jpeg";
  const mimeType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(rawMime.split(";")[0].trim())
    ? rawMime.split(";")[0].trim()
    : "image/jpeg";
  const base64 = Buffer.from(imgBuffer).toString("base64");
  const prompt = buildRamsayPrompt(title, description);

  const body = JSON.stringify({
    contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 300 },
  });

  for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      if (r.ok) {
        const data = await r.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return parseRamsayJSON(text);
      }
      if (r.status === 429 && attempt < 2) {
        await new Promise((res) => setTimeout(res, (attempt + 1) * 2000));
        continue;
      }
      break;
    }
  }
  throw new Error("Gemini unavailable");
}

async function rateWithGroq(
  apiKey: string,
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: buildRamsayPrompt(title, description) }] }],
      temperature: 0.9,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No Groq response");
  return parseRamsayJSON(text);
}
