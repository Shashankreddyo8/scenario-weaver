import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SimulationResult } from "@/lib/simulation-types";
import RelationshipGraph from "./RelationshipGraph";

interface Props {
  open: boolean;
  result: SimulationResult | null;
  scenarioInput: string;
  onClose: () => void;
}

export default function PresentationMode({ open, result, scenarioInput, onClose }: Props) {
  const [slide, setSlide] = useState(0);

  const total = result ? result.scenarios.length + (result.graph ? 1 : 0) + 1 : 0;

  useEffect(() => {
    if (!open) setSlide(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setSlide(s => Math.min(s + 1, total - 1));
      else if (e.key === "ArrowLeft") setSlide(s => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, total, onClose]);

  if (!result) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-6 left-6 z-10 text-xs text-muted-foreground font-mono">
            {slide + 1} / {total} • Esc to exit • ← → to navigate
          </div>

          <div className="h-screen w-screen flex items-center justify-center p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl"
              >
                {slide === 0 ? (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">Scenario</p>
                    <h1 className="text-5xl md:text-6xl font-bold text-gradient-primary leading-tight mb-8">
                      {scenarioInput}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {result.scenarios.length} simulated futures · {result.graph?.nodes.length || 0} actors mapped · {result.sources.length} sources
                    </p>
                  </div>
                ) : slide <= result.scenarios.length ? (
                  (() => {
                    const s = result.scenarios[slide - 1];
                    return (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-mono text-muted-foreground">S-{String(slide).padStart(2, "0")}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
                            {s.probability} · {s.confidence}%
                          </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{s.title}</h2>
                        <p className="text-xl text-muted-foreground leading-relaxed mb-6">{s.summary}</p>
                        <p className="text-base text-secondary-foreground leading-relaxed mb-6">{s.details}</p>
                        <div className="space-y-2">
                          {s.chainReactions.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 text-base text-secondary-foreground">
                              <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-sm flex-shrink-0">
                                {i + 1}
                              </span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : result.graph ? (
                  <div>
                    <h2 className="text-3xl font-bold text-gradient-primary mb-4 text-center">Relationship Graph</h2>
                    <div className="h-[70vh]">
                      <RelationshipGraph graph={result.graph} />
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            <button
              onClick={() => setSlide(s => Math.max(s - 1, 0))}
              disabled={slide === 0}
              className="w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? "w-8 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setSlide(s => Math.min(s + 1, total - 1))}
              disabled={slide === total - 1}
              className="w-10 h-10 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-foreground disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
