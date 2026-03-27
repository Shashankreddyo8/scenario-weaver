import { motion } from "framer-motion";
import { Database, Target, Crosshair } from "lucide-react";
import { SimulationResult } from "@/lib/simulation-types";

interface KnowledgePanelProps {
  result: SimulationResult;
}

export default function KnowledgePanel({ result }: KnowledgePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      {/* Retrieved Knowledge */}
      <div className="glass rounded-2xl p-5 gradient-border">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Retrieved Knowledge</h3>
        </div>
        <div className="space-y-2">
          {result.knowledgeRetrieved.map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="text-xs text-secondary-foreground bg-secondary/40 rounded-lg p-3 leading-relaxed"
            >
              {k}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions Predicted */}
      <div className="glass rounded-2xl p-5 gradient-border">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predicted Actions</h3>
        </div>
        <div className="space-y-1.5">
          {result.actionsPredicted.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2 text-xs text-secondary-foreground"
            >
              <Target className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {a}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
