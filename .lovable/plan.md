# ScenarioMind — Next Enhancements

Five focused upgrades, each isolated to keep the codebase clean.

## 1. What-if Branching

Let users explore alternative futures from any existing scenario or actor.

- Add a **"What if..."** button on each `ScenarioCard` and in the graph node detail panel.
- Opens a small modal with:
  - The original scenario/actor as locked context
  - A free-text twist field (e.g. "What if China retaliates with rare earth ban?")
  - "Run branch" button
- Re-invokes the `simulate` edge function with `parentScenario` + `twist` payload.
- Result is rendered as a **child branch** under the parent card (indented, with a connector line) instead of replacing the main results.
- A small breadcrumb shows the branching path: `Root → S-02 → Branch A`.

## 2. Live Web Grounding + Evidence Citations

Replace the model-only Knowledge Retrieval step with real recent sources.

- Use **Lovable AI** with Google search grounding (Gemini supports `google_search` tool) — no extra API key needed.
- Edge function: in the Knowledge Retrieval phase, ask the model to ground using web search and return `sources: [{title, url, snippet}]`.
- Each scenario gets a `citations: number[]` field referencing the sources list.
- **UI**:
  - `KnowledgePanel` lists clickable source cards with favicon + domain
  - Inline `[1]` `[2]` superscript chips inside scenario reasoning that highlight the matching source on hover
  - A confidence score (0–100%) per scenario shown next to the probability badge

If Gemini grounding is unreliable, fall back to **Perplexity** connector (will prompt user to connect).

## 3. Multi-Horizon Forecasts

Each scenario now produces three time horizons.

- Update edge function prompt + JSON schema so each scenario returns:
  - `shortTerm` (weeks) — immediate reactions
  - `midTerm` (months) — structural shifts
  - `longTerm` (years) — systemic outcomes
- `ScenarioCard` gains a 3-tab segmented control inside its expanded view (Short / Mid / Long).
- Each horizon shows its own chain reactions and a small intensity bar.

## 4. Scenario Templates

One-click starter prompts above the input bar.

- Add a `ScenarioTemplates` component rendered when no simulation is active.
- Categories: **Geopolitics**, **Markets**, **Product Launch**, **Crisis Response**, **Technology Shift**.
- Each card has icon + title + 1-line description; click fills the input and auto-runs.
- Template definitions live in `src/lib/templates.ts` (pure data, easy to edit).

## 5. Theme + Presentation Mode

- **Dark/light toggle** in the header using the existing `next-themes` pattern (already in shadcn). Update `index.css` to include a complete light token set; ensure all semantic tokens have light variants.
- **Presentation mode** button (top-right): hides header/sidebars, scales typography up, advances scenario cards with arrow keys, full-width relationship graph. Esc to exit. Useful for sharing results in meetings.

---

## Technical Details

**Files touched**
- `supabase/functions/simulate/index.ts` — accept `parentScenario`/`twist`, enable Gemini google_search grounding, return `sources`, `citations`, `confidence`, `shortTerm`/`midTerm`/`longTerm`
- `src/lib/simulation-types.ts` — extend `SimulationScenario` with horizons, citations, confidence; add `Source` type
- `src/lib/simulation-engine.ts` — pass branching params; map new fields
- `src/components/ScenarioCard.tsx` — horizon tabs, citation chips, confidence, "What if" button, branch rendering
- `src/components/KnowledgePanel.tsx` — clickable cited sources
- `src/components/RelationshipGraph.tsx` — "What if this actor..." button in detail panel
- **New**: `src/components/WhatIfDialog.tsx`, `src/components/ScenarioTemplates.tsx`, `src/components/PresentationMode.tsx`, `src/components/ThemeToggle.tsx`, `src/lib/templates.ts`
- `src/pages/Index.tsx` — wire templates, branch state tree, presentation mode, theme toggle
- `src/index.css` + `tailwind.config.ts` — full light theme tokens

**No DB changes** — everything stays client-side / stateless edge function. (History persistence can be a follow-up.)

**Order of implementation**
1. Types + edge function changes (foundation)
2. Multi-horizon UI in ScenarioCard
3. Citations + KnowledgePanel
4. What-if branching
5. Templates
6. Theme + presentation mode
