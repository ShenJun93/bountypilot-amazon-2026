# BountyPilot

BountyPilot is a self-hosted Model Context Protocol server plus a web-based Alexa+ simulation built for the **Amazon Developer Hackathon 2026 — Alexa+ track**.

It turns bounty hunting into a stateful agent workflow instead of a one-shot Q&A:

1. analyze an opportunity against an async, code-first profile;
2. save it to a persistent queue;
3. compare opportunities without hiding blockers;
4. build a concrete submission plan;
5. track progress across sessions;
6. ask for the next best action.

The simulator invokes the same tools through the MCP endpoint at runtime.

## Track technology

- Self-hosted MCP server
- Streamable HTTP endpoint: `/mcp`
- MCP TypeScript SDK v2
- Current SDK serves protocol era 2026-07-28 and retains 2025-era compatibility
- Web simulator uses an MCP client; it does not bypass the MCP tool layer

## Run

```bash
npm install
npm start
```

Open `http://127.0.0.1:4310`.

## Verify MCP

With the server running:

```bash
npm run smoke
```

The smoke client performs a real initialize handshake, lists tools, calls `analyze_opportunity`, and prints the negotiated protocol era.

## Tools

- `analyze_opportunity`
- `save_opportunity`
- `get_opportunity_queue`
- `compare_opportunities`
- `build_submission_plan`
- `set_opportunity_status`
- `next_best_action`

## State

Local demo state is stored in `data/state.json` and intentionally ignored by Git. `data/state.example.json` documents the shape.

## Privacy and cost

The current proof of concept uses no paid model API and sends no listing text to a third-party model. State is local to the self-hosted server.

## License

MIT.
