import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SCENARIO_TEMPLATES } from "@/lib/templates";

interface Props {
  onSelect: (prompt: string) => void;
}

export default function ScenarioTemplates({ onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-5xl mx-auto mt-10"
    >
      <div className="flex items-center gap-2 mb-4 justify-center">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
          Or start from a template
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SCENARIO_TEMPLATES.map((t, i) => (
          <motion.button
            key={t.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(t.prompt)}
            className="glass rounded-xl p-3.5 text-left gradient-border hover:glow-primary transition-shadow group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">{t.icon}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                {t.category}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
              {t.title}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-snug">{t.description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
