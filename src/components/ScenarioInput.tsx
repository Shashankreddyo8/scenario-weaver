import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, RotateCcw } from "lucide-react";

interface ScenarioInputProps {
  onSubmit: (input: string) => void;
  onRegenerate: () => void;
  isRunning: boolean;
  hasResults: boolean;
  value?: string;
  onChange?: (v: string) => void;
}

export default function ScenarioInput({ onSubmit, onRegenerate, isRunning, hasResults, value, onChange }: ScenarioInputProps) {
  const [internal, setInternal] = useState("");
  const input = value !== undefined ? value : internal;
  const setInput = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  const handleSubmit = () => {
    if (input.trim() && !isRunning) onSubmit(input.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto relative"
    >
      {/* Outer glow halo */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 opacity-40 blur-xl pointer-events-none" />

      <div className="relative glass-strong rounded-2xl p-2 glow-primary gradient-border">
        <div className="flex gap-2 items-center">
          <div className="pl-3 text-primary/70">
            <Zap className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Enter a scenario (e.g., War between two countries)"
            disabled={isRunning}
            className="flex-1 bg-transparent px-2 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-base disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={isRunning || !input.trim()}
            className="relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow-lg shadow-primary/20"
          >
            <Zap className="w-4 h-4" />
            {isRunning ? "Running..." : "Run Simulation"}
          </motion.button>
        </div>
      </div>

      {hasResults && !isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-4"
        >
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Regenerate Simulation
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
