import { motion } from "framer-motion";
import { Database, Target, Crosshair, ExternalLink, Newspaper } from "lucide-react";
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
      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="glass rounded-2xl p-5 gradient-border">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cited Sources</h3>
          </div>
          <div className="space-y-2">
            {result.sources.map((s, i) => (
              <motion.a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="block bg-secondary/40 rounded-lg p-3 hover:bg-secondary/70 hover:border-primary/30 border border-transparent transition-all group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 h-4 inline-flex items-center rounded mt-0.5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 mb-0.5">{s.title}</p>
                    {s.snippet && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1">{s.snippet}</p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="font-mono">{s.domain}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* Retrieved Knowledge */}
      <div className="glass rounded-2xl p-5 gradient-border">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pattern Insights</h3>
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

      {/* Predicted Actions */}
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
