// RAG ingestion: parse → chunk → embed → store
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { chunkText } from "../_shared/chunker.ts";
import { embedTexts } from "../_shared/embed.ts";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface IngestBody {
  filename: string;
  text: string; // raw text (frontend extracts from PDF via pdf.js)
  source_type?: string;
  hazard_tags?: string[];
  storage_path?: string;
  meta?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as IngestBody;
    if (!body?.text || !body?.filename) {
      return json({ error: "filename and text required" }, 400);
    }

    // 1. create document row
    const { data: doc, error: dErr } = await supa
      .from("documents")
      .insert({
        filename: body.filename,
        source_type: body.source_type || "pdf",
        hazard_tags: body.hazard_tags || autoTag(body.text),
        storage_path: body.storage_path,
        status: "processing",
        meta: body.meta || {},
      })
      .select()
      .single();
    if (dErr) throw dErr;

    // 2. chunk
    const chunks = chunkText(body.text, 800, 120);
    if (!chunks.length) {
      await supa.from("documents").update({ status: "empty" }).eq("id", doc.id);
      return json({ document: doc, chunks: 0 });
    }

    // 3. embed in batches
    const BATCH = 16;
    const rows: any[] = [];
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const vectors = await embedTexts(slice);
      slice.forEach((content, j) => {
        rows.push({
          document_id: doc.id,
          chunk_index: i + j,
          content,
          embedding: vectors[j],
          meta: { hazards: extractHazards(content) },
        });
      });
    }

    // 4. insert chunks
    const { error: cErr } = await supa.from("doc_chunks").insert(rows);
    if (cErr) throw cErr;

    await supa.from("documents").update({ status: "ready" }).eq("id", doc.id);
    return json({ document: doc, chunks: rows.length });
  } catch (e: any) {
    console.error("ingest error:", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function autoTag(text: string): string[] {
  const tags = new Set<string>();
  const lower = text.toLowerCase();
  const map: Record<string, string> = {
    fire: "fire", flood: "flood", chemical: "hazmat", hazmat: "hazmat",
    earthquake: "seismic", explosion: "blast", cyber: "cyber",
    medical: "medical", evacuation: "evacuation", terror: "terror",
    nuclear: "radiological", radiation: "radiological",
  };
  for (const k of Object.keys(map)) if (lower.includes(k)) tags.add(map[k]);
  return [...tags];
}

function extractHazards(text: string): string[] {
  // Hazard codes (e.g. H200), UN numbers (UN1203), serial numbers, NFPA, CAS
  const re = /\b(H\d{3}[A-Z]?|UN\d{4}|NFPA\s?\d+|CAS\s?\d{2,7}-\d{2}-\d|SOP-\d+|ICS-\d+)\b/gi;
  return [...new Set([...text.matchAll(re)].map(m => m[0].toUpperCase()))];
}
