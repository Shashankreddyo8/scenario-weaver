import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Swords, Handshake, Zap, Link2 } from "lucide-react";
import { SimulationGraph, GraphNode, GraphEdge, EdgeType } from "@/lib/simulation-types";

const EDGE_COLORS: Record<EdgeType, string> = {
  ally: "hsl(145, 60%, 45%)",
  enemy: "hsl(0, 70%, 55%)",
  neutral: "hsl(215, 15%, 50%)",
  influence: "hsl(175, 80%, 50%)",
  dependency: "hsl(35, 90%, 55%)",
};

const EDGE_ICONS: Record<EdgeType, typeof Shield> = {
  ally: Handshake,
  enemy: Swords,
  neutral: Link2,
  influence: Zap,
  dependency: Shield,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  country: "hsl(175, 80%, 50%)",
  organization: "hsl(260, 60%, 55%)",
  person: "hsl(35, 90%, 55%)",
  event: "hsl(0, 70%, 55%)",
};

function arrangeNodes(graphNodes: GraphNode[]): Node[] {
  const count = graphNodes.length;
  const cx = 400;
  const cy = 300;
  const radius = Math.max(200, count * 30);

  return graphNodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const jitter = (n.importance - 0.5) * 60;
    return {
      id: n.id,
      position: {
        x: cx + (radius + jitter) * Math.cos(angle),
        y: cy + (radius + jitter) * Math.sin(angle),
      },
      data: { label: n.label, graphNode: n },
      style: {
        background: `${NODE_TYPE_COLORS[n.type] || "hsl(215,15%,50%)"}`,
        color: "hsl(220, 20%, 6%)",
        border: "none",
        borderRadius: "50%",
        width: Math.max(50, n.importance * 90),
        height: Math.max(50, n.importance * 90),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.max(10, n.importance * 14)}px`,
        fontWeight: 600,
        boxShadow: `0 0 ${n.importance * 30}px ${NODE_TYPE_COLORS[n.type] || "hsl(215,15%,50%)"}40`,
        cursor: "pointer",
      },
    };
  });
}

function buildEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.label || e.type,
    style: {
      stroke: EDGE_COLORS[e.type] || "hsl(215,15%,50%)",
      strokeWidth: Math.max(1, e.strength * 4),
      opacity: 0.6 + e.strength * 0.4,
    },
    labelStyle: {
      fill: "hsl(210, 20%, 85%)",
      fontSize: 10,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "hsl(220, 18%, 10%)",
      fillOpacity: 0.85,
    },
    labelBgPadding: [4, 2] as [number, number],
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: EDGE_COLORS[e.type] || "hsl(215,15%,50%)",
      width: 16,
      height: 16,
    },
    data: { graphEdge: e },
  }));
}

interface SelectedNodeInfo {
  node: GraphNode;
  edges: GraphEdge[];
}

interface RelationshipGraphProps {
  graph: SimulationGraph;
}

export default function RelationshipGraph({ graph }: RelationshipGraphProps) {
  const initialNodes = useMemo(() => arrangeNodes(graph.nodes), [graph.nodes]);
  const initialEdges = useMemo(() => buildEdges(graph.edges), [graph.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<SelectedNodeInfo | null>(null);
  const [filter, setFilter] = useState<EdgeType | "all">("all");

  const filteredEdges = useMemo(() => {
    if (filter === "all") return edges;
    return edges.filter(e => (e.data as any)?.graphEdge?.type === filter);
  }, [edges, filter]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const graphNode = (node.data as any).graphNode as GraphNode;
    const relatedEdges = graph.edges.filter(
      e => e.source === graphNode.id || e.target === graphNode.id
    );
    setSelected({ node: graphNode, edges: relatedEdges });
  }, [graph.edges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl gradient-border overflow-hidden relative"
      style={{ height: 520 }}
    >
      {/* Filter bar */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap">
        {(["all", "ally", "enemy", "influence", "dependency", "neutral"] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all ${
              filter === t
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-secondary/60 text-muted-foreground border border-border/40 hover:bg-secondary"
            }`}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(220, 15%, 15%)" />
        <Controls
          showInteractive={false}
          style={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-3 text-[10px] text-muted-foreground">
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ background: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-0 right-0 w-72 h-full glass-strong border-l border-border/50 p-5 overflow-y-auto z-20"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: NODE_TYPE_COLORS[selected.node.type] }}
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {selected.node.type}
              </span>
            </div>
            <h4 className="text-lg font-bold text-foreground mb-1">{selected.node.label}</h4>
            <div className="text-xs text-muted-foreground mb-4">
              Importance: <span className="text-primary font-mono">{(selected.node.importance * 100).toFixed(0)}%</span>
            </div>

            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Relationships ({selected.edges.length})
            </h5>
            <div className="space-y-2">
              {selected.edges.map((edge, i) => {
                const Icon = EDGE_ICONS[edge.type] || Link2;
                const otherNode = edge.source === selected.node.id ? edge.target : edge.source;
                const otherLabel = graph.nodes.find(n => n.id === otherNode)?.label || otherNode;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: EDGE_COLORS[edge.type] }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground font-medium">{otherLabel}</span>
                      <div className="text-muted-foreground mt-0.5">
                        {edge.type} • strength {(edge.strength * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
