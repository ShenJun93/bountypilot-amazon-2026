# BountyPilot — 2 Minute Demo Runbook

Goal: prove agentic orchestration, real MCP use, and state across sessions without spending demo time on implementation details.

## 0:00–0:15 — Problem

Show the landing page.

Narration:
“Solo builders lose time deciding which bounties are worth pursuing and then lose context as opportunities move from research to build to submission. BountyPilot turns that into one persistent agent workflow.”

## 0:15–0:35 — Real MCP surface

Point to:
- `MCP · modern`
- self-hosted MCP / Streamable HTTP footer.

Explain briefly:
“The simulator is a client of the same self-hosted MCP endpoint. The browser does not call the analyzer directly.”

Optional terminal cut:
`npm run smoke`

Show:
- 7 tools
- modern protocol era
- successful tool call

## 0:35–1:05 — Multi-tool triage

Use the **Async hackathon** scenario and click **Ask BountyPilot**.

Show:
- GO verdict and score;
- reward/deadline/live-gate/pre-hire facts;
- explicit reasons;
- MCP orchestration trace:
  1. analyze
  2. save
  3. queue
  4. next action

Narration:
“One request orchestrates multiple tools and saves the opportunity instead of forgetting it after the answer.”

## 1:05–1:30 — Persistent context

Scroll to **Opportunity queue**.

Click **Build plan**.

Show the five concrete actions.

Reload the browser.

Show the opportunity is still present as `CANDIDATE`.

Narration:
“The queue survives sessions, so the next conversation can continue from the same state.”

## 1:30–1:50 — Guardrail contrast

Load **Live interview** and run it.

Show SKIP.

Explain:
“The agent preserves user constraints. It does not optimize only for prize size; mandatory live gates remain visible and can block the recommendation.”

## 1:50–2:00 — Close

Narration:
“BountyPilot is a reusable MCP workflow for deciding, remembering, and finishing opportunities. The same tool surface can be connected to Alexa+ while the self-hosted server keeps the state and execution logic.”

## Recording checklist

- English narration.
- Keep terminal text large enough to read.
- Do not expose credentials, local personal paths, email addresses, or private repositories.
- Use only synthetic/example bounty text in the recording.
- Capture the MCP orchestration trace and persistence reload.
- Keep final video below the hackathon time limit.
