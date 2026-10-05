# Production promotion and Demo V3 — 2026-10-05

## Production promotion

- Source: clean `git archive` of commit `9f4b710` (no local demo assets or untracked files).
- Preview first: `bountypilot-amazon-2026-qglagbxql-…vercel.app`, then `tools/list` returned 8 tools, `/health` returned `state: redis-durable`, and a triage → Daily Briefing smoke passed on a throwaway workspace that was reset afterwards.
- Production: `bountypilot-amazon-2026-4g0ba7gwq-…vercel.app`, aliased to https://bountypilot-amazon-2026.vercel.app
- Verifier: `mcp-protocol-proof` v0.2 with `--min 2025-11-25 --expect-tool daily_briefing` gave **PASS**, protocol `2026-07-28`, 8 tools, no missing tools.
  Receipt: `docs/receipts/mcp-protocol-proof-v0.2-production-2026-10-05.json`
- Rollback target if needed: the previous production deployment `bountypilot-amazon-2026-dzushgc07-…vercel.app` (seven tools).

## Demo V3

Replaces the local Demo V2 cut. V2 skipped the cross-session persistence, the SKIP guardrail, and a multi-item briefing.

Recorded against production with synthetic listings seeded into a dedicated workspace, which was reset afterwards:

1. Title card.
2. The app opens to "Welcome back, 3 open opportunities"; Daily Briefing ranks the three, with the pre-hire bounty flagged as a blocker.
3. GO triage for a new listing, with its MCP tool trace.
4. SKIP for a live-interview listing; the queue marks it skipped.
5. Tab reload, i.e. a new session: "Welcome back, 4 open"; the durable Redis badge; the briefing re-ranks and the skipped listing stays out.
6. `mcp-protocol-proof` result against the production endpoint: 8 tools, PASS.
7. End card: repo, 23/23 tests, Kiro Crew 11/11, open-source companion.

Technical: about 129 s, 1920x1080 at 30 fps, H.264 + AAC 48 kHz, burned-in captions, loudness-normalised (mean -18.8 dB, peak -0.8 dB), no black frames. Page-loading windows are cut so no half-loaded state appears.
