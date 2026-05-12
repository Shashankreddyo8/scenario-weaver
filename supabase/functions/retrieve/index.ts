// Hybrid retrieval: vector + BM25/tsvector + contextual rerank
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { embedOne } from "../_shared/embed.ts";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface RetrieveBody {
  query: string;
  k?: number;
  hazard_filter?: string[];
  rerank?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, k = 6, hazard_filter, rerank = true } = (await req.json()) as RetrieveBody;
    if (!query) return json({ error: "query required" }, 400);

    const t0 = Date.now();
    const embedding = await embedOne(query);
    const tEmbed = Date.now() - t0;

    const { data, error } = await supa.rpc("match_chunks", {
      query_embedding: embedding as any,
      query_text: query,
      match_count: k,
      hazard_filter: hazard_filter ?? null,
    });
    if (error) throw error;

    let results = (data || []) as any[];

    // Contextual rerank: boost chunks containing exact identifiers from query
    if (rerank) {
      const ids = [...query.matchAll(/\b(H\d{3}[A-Z]?|UN\d{4}|NFPA\s?\d+|CAS\s?\d{2,7}-\d{2}-\d|SOP-\d+|ICS-\d+)\b/gi)]
        .map(m => m[0].toUpperCase());
      if (ids.length) {
        results = results.map(r => {
          const txt = (r.content as string).toUpperCase();
          const hits = ids.filter(id => txt.includes(id)).length;
          return { ...r, hybrid_score: r.hybrid_score + hits * 0.25, identifier_hits: hits };
        }).sort((a, b) => b.hybrid_score - a.hybrid_score);
      }
    }

    // Attach document metadata
    const docIds = [...new Set(results.map(r => r.document_id))];
    const { data: docs } = await supa.from("documents").select("id,filename,hazard_tags,source_type").in("id", docIds);
    const docMap = new Map((docs || []).map(d => [d.id, d]));
    results = results.map(r => ({ ...r, document: docMap.get(r.document_id) }));

    return json({
      query,
      results,
      debug: { embed_ms: tEmbed, total_ms: Date.now() - t0, candidates: results.length },
    });
  } catch (e: any) {
    console.error("retrieve error:", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
