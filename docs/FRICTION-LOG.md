# BountyPilot: friction log

Amazon Developer Hackathon 2026, Alexa+ track. Submission 1204416.

There are three entries. Each one records the task attempted, the steps taken, expected vs. actual result, severity, the workaround used, and an actionable suggestion.

### Friction 1 — Preview-only Alexa+ tooling looked like part of the participant path

- Task attempted: determine which Alexa+ SDK/toolkit/simulator should be used for a hackathon entry.
- Steps taken: reviewed Alexa+ setup material, hackathon resources, FAQs, and track requirements.
- Expected: a directly accessible Alexa+ developer toolkit or simulator.
- Actual: preview-only Category SDK, MCP Toolkit, CLI, and Web Simulator are not available to general hackathon participants.
- Severity: Medium.
- Workaround: use the explicitly permitted self-hosted MCP route plus a custom web simulator.
- Suggestion: place a hackathon-specific banner at the top of Alexa+ setup guidance stating which tools are preview-only and linking immediately to the self-hosted MCP path.

### Friction 2 — No obvious runtime proof for the minimum MCP protocol requirement

- Task attempted: prove the production endpoint meets the minimum MCP protocol version.
- Steps taken: connected with the official MCP client, inspected the negotiated protocol version, listed tools, and built a reusable validator.
- Expected: a simple official conformance command or documented verification recipe.
- Actual: the application could work while still leaving the exact negotiated version implicit unless the client inspection API was used.
- Severity: Medium.
- Workaround: created the open-source `mcp-protocol-proof` CLI.
- Suggestion: publish an official one-command compatibility check that reports negotiated protocol version, transport, and discovered tool count.

### Friction 3 — Simulation expectations needed clarification

- Task attempted: determine how closely a web-based Alexa+ simulation must resemble a real Alexa+ UI and whether voice is required.
- Steps taken: checked rules, FAQ, and organizer forum clarification.
- Expected: a concise simulator acceptance checklist in the track requirements.
- Actual: the rules allow simulation, but details such as voice requirement and custom UI flexibility required clarification.
- Severity: Low.
- Workaround: used a high-quality custom web UI and a real MCP backend/tool surface; voice input/output is not required for the simulation.
- Suggestion: add a short checklist covering voice, visual fidelity, custom UI, and what the demo video should prove.

## Evidence

- Self-hosted MCP endpoint: https://bountypilot-amazon-2026.vercel.app/mcp
- Production protocol receipt (PASS, 8 tools): [`docs/receipts/mcp-protocol-proof-v0.2-production-2026-10-05.json`](receipts/mcp-protocol-proof-v0.2-production-2026-10-05.json)
- Workaround tool from Friction 2: https://github.com/ShenJun93/mcp-protocol-proof
