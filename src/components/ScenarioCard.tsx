import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Users, GitBranch, Brain } from "lucide-react";
import { SimulationScenario } from "@/lib/simulation-types";

interface ScenarioCardProps {
  scenario: SimulationScenario;
  index: number;
}

const probabilityColors: Record<string, string> = {
  High: "bg-probability-high/15 text-probability-high border-probability-high/30",
  Medium: "bg-probability-medium/15 text-probability-medium border-probability-medium/30",
  Low: "bg-probability-low/15 text-probability-low border-probability-low/30",
};

export default function ScenarioCard({ scenario, index }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden gradient-border hover:glow-primary transition-shadow duration-500"
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${probabilityColors[scenario.probability]}`}>
                {scenario.probability} Probability
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                S-{String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1.5">{scenario.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{scenario.summary}</p>
          </div>
          <button className="mt-1 p-1 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4">
              {/* Details */}
              <p className="text-sm text-secondary-foreground leading-relaxed">{scenario.details}</p>

              {/* Actors */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Actors</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {scenario.actors.map((actor, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground">{actor.name}</p>
                      <p className="text-xs text-muted-foreground">{actor.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chain Reactions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chain Reactions</span>
                </div>
                <div className="space-y-1.5">
                  {scenario.chainReactions.map((reaction, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center flex-shrink-0 font-mono">
                        {i + 1}
                      </span>
                      {reaction}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reasoning</span>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">{scenario.reasoning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
