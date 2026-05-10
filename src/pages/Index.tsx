import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, LayoutGrid, Share2, Presentation } from "lucide-react";
import { toast } from "sonner";
import ScenarioInput from "@/components/ScenarioInput";
import AgentPipeline from "@/components/AgentPipeline";
import ScenarioCard from "@/components/ScenarioCard";
import SimulationStatus from "@/components/SimulationStatus";
import KnowledgePanel from "@/components/KnowledgePanel";
import RelationshipGraph from "@/components/RelationshipGraph";
import ScenarioTemplates from "@/components/ScenarioTemplates";
import WhatIfDialog from "@/components/WhatIfDialog";
import PresentationMode from "@/components/PresentationMode";
import ThemeToggle from "@/components/ThemeToggle";
import { Agent, AGENTS, SimulationResult, SimulationScenario } from "@/lib/simulation-types";
import { runSimulation, runBranch } from "@/lib/simulation-engine";

export default function Index() {
  const [isRunning, setIsRunning] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastInput, setLastInput] = useState("");
  const [activeView, setActiveView] = useState<"scenarios" | "graph">("scenarios");
  const [highlightActor, setHighlightActor] = useState<string | null>(null);
  const [whatIfTarget, setWhatIfTarget] = useState<SimulationScenario | null>(null);
  const [branchLoading, setBranchLoading] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleRun = useCallback(async (input: string) => {
    setIsRunning(true);
    setResult(null);
    setLastInput(input);
    setInputValue(input);
    setActiveView("scenarios");
    setHighlightActor(null);
    setAgents(AGENTS.map(a => ({ ...a, status: "pending", output: undefined })));

    try {
      const simResult = await runSimulation(input, setAgents);
      setResult(simResult);
    } catch (e: any) {
      console.error("Simulation error:", e);
      toast.error(e?.message || "Simulation failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    if (lastInput) handleRun(lastInput);
  }, [lastInput, handleRun]);

  const handleTemplate = useCallback((prompt: string) => {
    setInputValue(prompt);
    handleRun(prompt);
  }, [handleRun]);

  const handleBranchSubmit = useCallback(async (twist: string) => {
    if (!whatIfTarget || !result) return;
    setBranchLoading(true);
    try {
      const branches = await runBranch(lastInput, whatIfTarget, twist);
      setResult(prev => {
        if (!prev) return prev;
        const updateTree = (list: SimulationScenario[]): SimulationScenario[] =>
          list.map(s => {
            if (s.id === whatIfTarget.id) {
              return { ...s, branches: [...(s.branches || []), ...branches] };
            }
            if (s.branches?.length) {
              return { ...s, branches: updateTree(s.branches) };
            }
            return s;
          });
        return { ...prev, scenarios: updateTree(prev.scenarios) };
      });
      toast.success(`${branches.length} branch outcomes generated`);
      setWhatIfTarget(null);
    } catch (e: any) {
      toast.error(e?.message || "Branch failed");
    } finally {
      setBranchLoading(false);
    }
  }, [whatIfTarget, result, lastInput]);

  const showPipeline = isRunning || result;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background: grid + aurora blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute top-[-15%] left-[-10%] w-[640px] h-[640px] rounded-full opacity-[0.18] animate-aurora blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[560px] h-[560px] rounded-full opacity-[0.16] animate-aurora blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.6), transparent 70%)", animationDelay: "-6s" }} />
        <div className="absolute top-[30%] right-[20%] w-[380px] h-[380px] rounded-full opacity-[0.10] animate-aurora blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)", animationDelay: "-12s" }} />
      </div>

      <div className="relative z-10">
        <header className="border-b border-border/40">
          <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">ScenarioMind</h1>
                <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">Multi-Agent Simulation Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono">10 Agents · Graph · Multi-Horizon</span>
              </div>
              {result && (
                <button
                  onClick={() => setPresentation(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  Present
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section className={`transition-all duration-700 ${showPipeline ? "py-8" : "py-20"}`}>
          <div className="container max-w-7xl mx-auto px-6">
            <AnimatePresence>
              {!showPipeline && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4">
                    Simulate the Future
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Enter any scenario. Multi-agent AI builds relationship graphs, cites real sources, and forecasts across short, mid, and long horizons.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <ScenarioInput
              onSubmit={handleRun}
              onRegenerate={handleRegenerate}
              isRunning={isRunning}
              hasResults={!!result}
              value={inputValue}
              onChange={setInputValue}
            />

            {!showPipeline && <ScenarioTemplates onSelect={handleTemplate} />}

            {isRunning && (
              <div className="mt-6">
                <SimulationStatus agents={agents} />
              </div>
            )}
          </div>
        </section>

        <AnimatePresence>
          {showPipeline && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="pb-16"
            >
              <div className="container max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-3">
                    <AgentPipeline agents={agents} />
                  </div>

                  <div className="lg:col-span-6">
                    {result ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            onClick={() => setActiveView("scenarios")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              activeView === "scenarios"
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "bg-secondary/50 text-muted-foreground border border-border/40 hover:text-foreground"
                            }`}
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Scenarios
                          </button>
                          {result.graph && (
                            <button
                              onClick={() => setActiveView("graph")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activeView === "graph"
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "bg-secondary/50 text-muted-foreground border border-border/40 hover:text-foreground"
                              }`}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Relationship Graph
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px]">
                                {result.graph.nodes.length}
                              </span>
                            </button>
                          )}
                        </div>

                        {activeView === "scenarios" ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Generated Scenarios
                              </h3>
                              {highlightActor && (
                                <button
                                  onClick={() => setHighlightActor(null)}
                                  className="text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
                                >
                                  Filter: {highlightActor} ✕
                                </button>
                              )}
                            </div>
                            {result.scenarios.map((s, i) => (
                              <ScenarioCard
                                key={s.id}
                                scenario={s}
                                index={i}
                                highlightActor={highlightActor}
                                sources={result.sources}
                                onWhatIf={setWhatIfTarget}
                              />
                            ))}
                          </div>
                        ) : result.graph ? (
                          <RelationshipGraph
                            graph={result.graph}
                            onNodeSelect={(label) => {
                              setHighlightActor(label);
                              if (label) setActiveView("scenarios");
                            }}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
                        />
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    {result && <KnowledgePanel result={result} />}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <WhatIfDialog
        open={!!whatIfTarget}
        parent={whatIfTarget}
        onClose={() => !branchLoading && setWhatIfTarget(null)}
        onSubmit={handleBranchSubmit}
        loading={branchLoading}
      />

      <PresentationMode
        open={presentation}
        result={result}
        scenarioInput={lastInput}
        onClose={() => setPresentation(false)}
      />
    </div>
  );
}
