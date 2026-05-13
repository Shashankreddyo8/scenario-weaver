// Embedding helper using Google AI Studio (gemini-embedding-001 → truncated to 768 dims)
const MODEL = "gemini-embedding-001";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`;

export async function embedOne(text: string): Promise<number[]> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(`${URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.embedding?.values as number[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  // sequential with small concurrency to respect free-tier RPM
  const out: number[][] = [];
  const CONC = 4;
  for (let i = 0; i < texts.length; i += CONC) {
    const batch = texts.slice(i, i + CONC);
    const vecs = await Promise.all(batch.map(embedOne));
    out.push(...vecs);
  }
  return out;
}
