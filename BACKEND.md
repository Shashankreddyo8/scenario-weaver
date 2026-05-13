# ScenarioMind — Backend Architecture

> Ported from the requested FastAPI/LangChain/LangGraph spec to **Supabase Edge Functions (Deno) + pgvector**, since Lovable doesn't host Python. Same capabilities, same shapes.

## Layout

```
supabase/functions/
├── _shared/
│   ├── cors.ts          # CORS headers
│   ├── chunker.ts       # Recursive text splitter (LangChain-style)
│   └── embed.ts         # Gemini text-embedding-001 → 768-dim vectors
├── simulate/            # Existing 10-agent orchestration
├── ingest-document/     # PDF/text → chunk → embed → store
├── retrieve/            # Hybrid vector + tsvector + identifier rerank
├── chaos-engine/        # Inject power/cyber/weather/misinfo events
└── evaluate-decision/   # Compare user decision vs retrieved protocols → AAR
```

## Database (pgvector)

| table              | purpose                                                   |
|--------------------|-----------------------------------------------------------|
| documents          | uploaded protocols, hazard tags, status                   |
| doc_chunks         | text chunks + 768-dim embedding + tsvector + trgm index   |
| simulations        | central state (threat, casualties, weather, sentiment…)   |
| simulation_events  | timeline + chaos injections (realtime-published)          |
| agent_memory       | role-scoped memory per simulation                         |
| evaluations        | compliance score + after-action report                    |

`match_chunks(query_embedding, query_text, k, hazard_filter)` does hybrid search: 0.7·cosine + 0.3·ts_rank.

## Endpoints

| function          | body                                                                  |
|-------------------|-----------------------------------------------------------------------|
| ingest-document   | `{ filename, text, hazard_tags?, source_type? }`                      |
| retrieve          | `{ query, k?, hazard_filter?, rerank? }`                              |
| chaos-engine      | `{ simulation_id, type? }`                                            |
| evaluate-decision | `{ simulation_id?, decision, context? }`                              |
| simulate          | `{ scenario, parentScenario?, twist? }` (existing)                    |

## Frontend additions

- `ProtocolUpload` — PDF (parsed via `pdfjs-dist` in browser), TXT, MD, or paste
- `RetrievalDebugPanel` — live hybrid query tester with score breakdown
- `SimulationEventStream` — realtime postgres_changes feed

## Secrets

- `GEMINI_API_KEY` — Google AI Studio key (free tier OK), used for `gemini-embedding-001` (truncated to 768 dims)
- `LOVABLE_API_KEY` — Lovable AI Gateway, used by `simulate` and `evaluate-decision`

## Identifier-aware retrieval

Hazard codes, UN numbers, NFPA codes, CAS numbers, SOP/ICS IDs are auto-extracted from chunks and boosted at query time when present in the question.
