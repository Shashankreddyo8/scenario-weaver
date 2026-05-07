import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Zap } from "lucide-react";
import { SimulationScenario } from "@/lib/simulation-types";

interface Props {
  open: boolean;
  parent: SimulationScenario | null;
  onClose: () => void;
  onSubmit: (twist: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  "What if a key actor backs down?",
  "What if a third party intervenes?",
  "What if markets crash 20% overnight?",
  "What if a leak goes public?",
];

export default function WhatIfDialog({ open, parent, onClose, onSubmit, loading }: Props) {
  const [twist, setTwist] = useState("");

  const submit = () => {
    if (twist.trim() && !loading) onSubmit(twist.trim());
  };

  return (
    <AnimatePresence>
      {open && parent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="glass-strong rounded-2xl gradient-border w-full max-w-lg p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                Branch from
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{parent.title}</h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{parent.summary}</p>

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Inject a twist
            </label>
            <textarea
              value={twist}
              onChange={e => setTwist(e.target.value)}
              disabled={loading}
              rows={3}
              placeholder="e.g. What if China retaliates with a rare earth ban?"
              className="w-full bg-secondary/50 border border-border/40 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />

            <div className="flex flex-wrap gap-1.5 mt-3">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setTwist(s)}
                  className="text-[10px] px-2 py-1 rounded-full bg-secondary/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || !twist.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              >
                <Zap className="w-3.5 h-3.5" />
                {loading ? "Simulating..." : "Run branch"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
