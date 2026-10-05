# BountyPilot — Prize Optimization Submission Update

Local draft only. This does not change the current Devpost submission until an explicit external edit is performed.

## Positioning

BountyPilot is a persistent Alexa+ opportunity operator for independent builders. It does not stop at deciding whether a bounty is worth pursuing: it keeps a durable queue, tracks lifecycle state, preserves blockers, and turns the queue into a daily execution brief.

## New judge-facing capability

Daily Briefing answers: "What should I work on today?"

It returns up to three active opportunities with fit score, lifecycle status, reward/deadline evidence, the first unresolved blocker or unknown, and one concrete next action. Actionable work is ranked ahead of already-submitted work.

The conversation layer calls the real daily_briefing MCP tool and renders a dedicated briefing card.

## Alexa+ / MCP update

Local candidate now exposes 8 coherent MCP tools:
- analyze_opportunity
- save_opportunity
- get_opportunity_queue
- compare_opportunities
- build_submission_plan
- set_opportunity_status
- daily_briefing
- next_best_action

The same tool surface is used by the web simulator through the official SDK and by external clients through Streamable HTTP. Production must be re-verified after deployment before this is copied into Devpost.

## Open Source Mini Challenge update

mcp-protocol-proof v0.2 upgrades the companion project from a one-off verifier into a CI-oriented compatibility proof tool.

v0.2 adds bounded timeouts, deterministic receipt schema mcp-protocol-proof/v1, --output JSON artifact support, stable exit codes, missing-tool checks, a GitHub Actions recipe, and failure-path tests.

Do not replace the submitted contribution commit URL until the v0.2 branch is pushed and a new public commit exists.

## AWS Builder Mini Challenge

Organizer rules explicitly say Kiro Crew qualifies on its own as a development tool when the integration/use is documented.

Current state: NOT YET QUALIFIED.

Do not claim AWS Builder until official Kiro Crew is installed and signed in, runs the task in docs/KIRO-CREW-TASK.md, produces a meaningful reviewed change, and the normal regression suite passes.

## Friction-log audit

The existing submission pack contains three detailed friction logs, but the current receipt only proves the source document URL was supplied. Before editing Devpost, verify whether all three structured friction-log entries are actually present in the submission fields.

## Updated demo story

1. problem + Daily Briefing;
2. multi-tool listing triage;
3. persistence after reload/new session;
4. SKIP guardrail contrast;
5. MCP proof / 8-tool runtime evidence;
6. close on persistent Alexa+ workflow, not one-shot Q&A.

## External update gates

- [ ] Kiro Crew evidence complete before AWS Builder claim.
- [ ] Candidate deployed and production smoke shows 8 tools.
- [ ] mcp-protocol-proof v0.2 pushed publicly.
- [ ] Updated demo reviewed and published.
- [ ] Friction-log fields audited in Devpost.
- [ ] Devpost edit preview checked.
- [ ] Explicit final approval before saving/publishing the edited submission.
