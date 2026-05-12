import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// pdfjs (browser)
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const txt = await page.getTextContent();
    out += txt.items.map((i: any) => i.str).join(" ") + "\n\n";
  }
  return out;
}

interface Props { open: boolean; onClose: () => void; onUploaded?: () => void }

export default function ProtocolUpload({ open, onClose, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState<{ chunks: number } | null>(null);

  const ingest = useCallback(async (filename: string, text: string) => {
    setBusy(true);
    setDone(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-document", {
        body: { filename, text, source_type: "protocol" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDone({ chunks: data.chunks });
      toast.success(`Ingested ${data.chunks} chunks from ${filename}`);
      onUploaded?.();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }, [onUploaded]);

  const onFile = useCallback(async (f: File) => {
    try {
      const text = f.type === "application/pdf" || f.name.endsWith(".pdf")
        ? await extractPdfText(f)
        : await f.text();
      if (!text.trim()) return toast.error("No text extracted");
      await ingest(f.name, text);
    } catch (e: any) {
      toast.error(e?.message || "Parse failed");
    }
  }, [ingest]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-6 shadow-2xl glow-primary"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Ingest Protocol</h3>
            <p className="text-xs text-muted-foreground">PDF, TXT, MD, or paste — chunked, embedded, indexed for retrieval.</p>
          </div>
        </div>

        <label className="block">
          <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm font-medium">Drop or click to upload</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">.pdf .txt .md</div>
            <input
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              className="hidden"
              disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />
          </div>
        </label>

        <div className="my-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">or paste raw text</div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Protocol name (e.g. SOP-12 Hazmat Response)"
          className="w-full mb-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/50"
        />
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Paste protocol text here…"
          rows={5}
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/50 scrollbar-thin"
        />
        <button
          disabled={busy || !pasted.trim() || !name.trim()}
          onClick={() => ingest(name, pasted)}
          className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground disabled:opacity-50 hover:brightness-110 transition-all"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Ingest text"}
        </button>

        {done && (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" /> {done.chunks} chunks indexed and ready for retrieval.
          </div>
        )}
      </motion.div>
    </div>
  );
}
