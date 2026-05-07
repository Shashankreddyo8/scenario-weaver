import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Users, GitBranch, Brain, Zap, Clock, TrendingUp, Calendar } from "lucide-react";
import { SimulationScenario, Source } from "@/lib/simulation-types";

interface ScenarioCardProps {
  scenario: SimulationScenario;
  index: number;
  highlightActor?: string | null;
  sources?: Source[];
  onWhatIf?: (scenario: SimulationScenario) => void;
  depth?: number;
}

const probabilityColors: Record<string, string> = {
  High: "bg-probability-high/15 text-probability-high border-probability-high/30",
  Medium: "bg-probability-medium/15 text-probability-medium border-probability-medium/30",
  Low: "bg-probability-low/15 text-probability-low border-probability-low/30",
};

const HORIZON_META = {
  short: { label: "Short", sublabel: "Weeks", icon: Zap },
  mid: { label: "Mid", sublabel: "Months", icon: Clock },
  long: { label: "Long", sublabel: "Years", icon: Calendar },
};

function renderReasoning(text: string, citations: number[], sources: Source[]) {
  // Replace [n] markers with chips
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const idx = parseInt(m[1], 10);
      const src = sources[idx];
      if (src) {
        return (
          <a
            key={i}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${src.title} — ${src.domain}`}
            className="inline-flex items-center justify-center mx-0.5 px-1.5 h-4 rounded text-[10px] font-mono bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors align-text-top"
          >
            {idx + 1}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ScenarioCard({
  scenario,
  index,
  highlightActor,
  sources = [],
  onWhatIf,
  depth = 0,
}: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [horizon, setHorizon] = useState<"short" | "mid" | "long">("short");

  const matches = !!highlightActor && scenario.actors.some(
    a => a.name.toLowerCase().includes(highlightActor.toLowerCase()) ||
         highlightActor.toLowerCase().includes(a.name.toLowerCase())
  );
  const dimmed = !!highlightActor && !matches;

  const cited = scenario.citations
    .map(i => ({ idx: i, src: sources[i] }))
    .filter(c => c.src);

  return (
    <div className={depth > 0 ? "relative pl-6 ml-2 border-l-2 border-accent/40" : ""}>
      {depth > 0 && (
        <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-accent" />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className={`glass rounded-2xl overflow-hidden gradient-border transition-all duration-500 ${
          matches ? "ring-2 ring-primary glow-primary" : "hover:glow-primary"
        }`}
      >
        {scenario.parentTwist && (
          <div className="px-5 pt-3 -mb-1 flex items-center gap-2 text-[11px] text-accent">
            <GitBranch className="w-3 h-3" />
            <span className="font-mono italic">"{scenario.parentTwist}"</span>
          </div>
        )}
        <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${probabilityColors[scenario.probability]}`}>
                  {scenario.probability}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <TrendingUp className="w-3 h-3" />
                  <span>{scenario.confidence}% confidence</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {depth > 0 ? `B-${index + 1}` : `S-${String(index + 1).padStart(2, "0")}`}
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
                <p className="text-sm text-secondary-foreground leading-relaxed">{scenario.details}</p>

                {/* Multi-horizon */}
                {scenario.horizons && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horizons</span>
                    </div>
                    <div className="flex gap-1 mb-3 p-1 rounded-lg bg-secondary/40 w-fit">
                      {(["short", "mid", "long"] as const).map(h => {
                        const meta = HORIZON_META[h];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={h}
                            onClick={() => setHorizon(h)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                              horizon === h
                                ? "bg-primary/20 text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                            <span className="text-[9px] opacity-60">{meta.sublabel}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Intensity</span>
                        <div className="flex-1 h-1 bg-border/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${(scenario.horizons[horizon].intensity || 0.5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-secondary-foreground leading-relaxed mb-2">
                        {scenario.horizons[horizon].summary}
                      </p>
                      <div className="space-y-1">
                        {scenario.horizons[horizon].chainReactions.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="w-4 h-4 mt-0.5 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-[10px] flex-shrink-0">
                              {i + 1}
                            </span>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Chain Reactions (overall) */}
                {!scenario.horizons && (
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
                )}

                {/* Reasoning with citations */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reasoning</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {renderReasoning(scenario.reasoning, scenario.citations, sources)}
                  </p>
                  {cited.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {cited.map(({ idx, src }) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2 py-1 rounded-md bg-secondary/50 border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                        >
                          [{idx + 1}] {src.domain}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* What-if button */}
                {onWhatIf && (
                  <div className="pt-2 border-t border-border/30">
                    <button
                      onClick={(e) => { e.stopPropagation(); onWhatIf(scenario); }}
                      className="flex items-center gap-2 text-xs text-accent hover:text-accent-foreground hover:bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/30 transition-all"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      What if...
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Branches */}
      {scenario.branches && scenario.branches.length > 0 && (
        <div className="mt-3 space-y-3">
          {scenario.branches.map((b, i) => (
            <ScenarioCard
              key={b.id}
              scenario={b}
              index={i}
              sources={sources}
              onWhatIf={onWhatIf}
              depth={depth + 1}
              highlightActor={highlightActor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
