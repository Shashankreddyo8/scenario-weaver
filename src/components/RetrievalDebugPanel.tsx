import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Database, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Hit {
  id: string;
  content: string;
  hybrid_score: number;
  vector_score: number;
  keyword_score: number;
  identifier_hits?: number;
  document?: { filename: string; hazard_tags?: string[] };
}

export default function RetrievalDebugPanel() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [debug, setDebug] = useState<any>(null);

  const run = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("retrieve", {
        body: { query: q, k: 6, rerank: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setHits(data.results || []);
      setDebug(data.debug);
    } catch (e: any) {
      toast.error(e?.message || "Retrieval failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">Retrieval Debug</h4>
        {debug && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            embed {debug.embed_ms}ms · total {debug.total_ms}ms
          </span>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Test a query (e.g. UN1203 spill response)"
          className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={run}
          disabled={busy}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        {hits.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-lg border border-border/40 bg-secondary/30 p-2.5"
          >
            <div className="flex items-center gap-2 text-[10px] font-mono mb-1">
              <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary">#{i + 1}</span>
              <span className="text-muted-foreground truncate">{h.document?.filename || "?"}</span>
              <span className="ml-auto text-primary">{h.hybrid_score.toFixed(3)}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1.5 text-[9px] font-mono text-muted-foreground">
              <span>vec {h.vector_score.toFixed(2)}</span>
              <span>kw {h.keyword_score.toFixed(2)}</span>
              {!!h.identifier_hits && <span className="text-accent flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{h.identifier_hits}</span>}
              {h.document?.hazard_tags?.map(t => (
                <span key={t} className="px-1 rounded bg-accent/15 text-accent">{t}</span>
              ))}
            </div>
            <p className="text-xs text-foreground/80 line-clamp-3">{h.content}</p>
          </motion.div>
        ))}
        {!hits.length && !busy && (
          <p className="text-xs text-muted-foreground text-center py-6">No results yet — upload protocols and run a query.</p>
        )}
      </div>
    </div>
  );
}
