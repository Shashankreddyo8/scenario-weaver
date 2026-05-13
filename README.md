# Scenario Weaver

Scenario Weaver is an AI-powered simulation and operational reasoning platform designed for crisis response, protocol analysis, and decision evaluation.

Built on a lightweight edge-native architecture using React, Supabase Edge Functions, PostgreSQL, and pgvector, the platform combines Retrieval-Augmented Generation (RAG), hybrid search, agent memory, and event-driven simulation workflows.

---

# Key Capabilities

## AI-Driven Simulations
- Multi-step operational simulations
- Stateful event progression
- Dynamic agent interactions
- Scenario branching and escalation
- Real-time event streaming architecture

## Retrieval-Augmented Generation (RAG)
- Semantic retrieval using pgvector
- Hybrid ranking pipeline:
  - Vector similarity
  - PostgreSQL full-text ranking
  - Identifier-aware reranking
- Context grounding for simulation decisions
- Retrieval debugging and trace inspection

## Protocol & Document Intelligence
Upload and query:
- SOPs
- Emergency response manuals
- Hazard documentation
- Incident reports
- Operational procedures

Supported formats:
- PDF
- TXT

## Hazard & Identifier Awareness
Optimized retrieval for:
- UN hazard codes
- NFPA classifications
- CAS registry identifiers
- SOP references
- Operational procedure identifiers

## Evaluation & After-Action Reporting
- Simulation outcome scoring
- Decision evaluation pipelines
- Failure analysis
- Timeline reconstruction
- Automated AAR generation

---

# Architecture

```text
┌──────────────────────────────┐
│        React + Vite          │
│      Frontend Interface      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Supabase Edge Functions    │
│     Deno + TypeScript        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Retrieval Pipeline      │
│  Hybrid Semantic + Keyword   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PostgreSQL + pgvector        │
│ Documents • Memory • Events  │
└──────────────────────────────┘
