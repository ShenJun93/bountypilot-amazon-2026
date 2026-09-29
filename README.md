# BountyPilot

BountyPilot is a self-hosted Model Context Protocol server plus a web-based Alexa+ simulation built for the **Amazon Developer Hackathon 2026 — Alexa+ track**.

It turns bounty hunting into a stateful agent workflow instead of a one-shot Q&A:

1. analyze an opportunity against an async, code-first profile;
2. save it to a persistent queue;
3. compare opportunities without hiding blockers;
4. build a concrete submission plan;
5. track progress across sessions;
6. ask for the next best action.

The simulator invokes the same seven MCP tools through the official SDK using an in-memory MCP transport. The separately exposed `/mcp` route serves the same tool surface over Streamable HTTP for external clients and Alexa+ integration.

## Track technology

- Self-hosted MCP server
- Streamable HTTP endpoint: `/mcp`
- MCP TypeScript SDK v2
- Verified negotiated protocol version: `2026-07-28` (newer than the hackathon minimum `2025-11-25`)
- Web simulator uses an MCP client over the SDK's in-memory transport; it does not bypass the MCP tool layer
- Public `/mcp` uses Streamable HTTP and exposes the same seven tools

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

On Vercel, the demo writes state under the function's `/tmp` directory so the app can operate without a separate database. That storage is ephemeral and may reset on a cold start. Durable hosted persistence is intentionally left as a follow-up integration rather than being overstated in the PoC.

## Privacy and cost

The current proof of concept uses no paid model API and sends no listing text to a third-party model. State is local to the self-hosted server.

## License

MIT.
