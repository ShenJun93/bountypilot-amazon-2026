# Amazon Prize Optimization — External Promotion Plan

Local-only plan. No external action is authorized by this document.

## Current candidate

Primary repo:
- workspace: `E:\Projects\bountypilot-amazon-2026`
- branch: `work/amazon-prize-optimization-v1`
- local HEAD before this receipt update: `b6fb9309a8afad82ee5b31c6e5bd0e946c6bd473`
- regression: **19/19 PASS**
- local MCP smoke: **8 tools / PASS**
- negotiated protocol: `2026-07-28`
- new judge-facing capability: `daily_briefing`

Open-source companion:
- submitted public repo: `https://github.com/ShenJun93/mcp-protocol-proof`
- submitted public commit: `ecd8552ce5b55ee71f63ed3d4f26bfcd111e62ba`
- superseded prototype: nested local commit `03a96cf`, **7/7 PASS**; do not push this history.
- canonical push candidate: `E:\\Projects\\mcp-protocol-proof-public-v0.2`, branch `work/mcp-protocol-proof-v0.2-public`, commit `411869d9d57604fbb26119ff6002f392326920f6`, **7/7 PASS**.
- canonical candidate is a direct child of the submitted public commit `ecd8552ce5b55ee71f63ed3d4f26bfcd111e62ba`, so no history rewrite or force push is needed.

AWS Builder:
- current Devpost choice: **No**
- candidate qualification: **NOT YET QUALIFIED**
- Kiro Crew installed/authenticated: **No**
- claim AWS Builder only after a genuine Kiro Crew task is run, reviewed, tested, and recorded.

## Recommended safe promotion sequence

### Gate A — Kiro Crew

Requires explicit approval because it installs/authenticates an external AWS/Kiro tool.

1. Install official Kiro Crew/CLI.
2. User completes login/terms if prompted.
3. Run only `docs/KIRO-CREW-TASK.md`.
4. Review the resulting diff.
5. Run `node --test` + `git diff --check`.
6. Complete `docs/KIRO-CREW-EVIDENCE.md`.
7. Only then mark the AWS Builder candidate as eligible.

### Gate B — Open Source v0.2

Requires explicit public push approval.

1. Rebase/port v0.2 onto a fresh local clone of the public `mcp-protocol-proof` history.
2. Run its 7/7 tests and a BountyPilot endpoint proof.
3. Push one reviewed commit to the public repo.
4. Capture the exact public commit URL.
5. Update Amazon Devpost Open Source contribution URL only after the public commit exists.

### Gate C — BountyPilot candidate

Requires explicit public push/deploy approval.

1. Push the optimized BountyPilot branch.
2. Deploy a preview or production candidate.
3. Verify:
   - health;
   - 8 tools;
   - `daily_briefing`;
   - protocol `2026-07-28`;
   - analyzer GO/98;
   - durable state;
   - browser Daily Briefing flow.
4. Do not update Devpost claims unless production evidence passes.

### Gate D — Presentation

Requires explicit publication approval.

1. Capture the Demo V2 sequence.
2. Verify audio/video/media.
3. Publish updated video.
4. Capture judge-ready screenshots.

### Gate E — Devpost edit

Requires explicit Devpost-edit approval.

Before saving:
- confirm Alexa+ remains the primary track;
- mark AWS Builder = Yes only if Gate A passed;
- keep Open Source = Yes;
- replace contribution commit only if Gate B passed;
- verify all 3 friction logs are present in the actual form fields;
- update 7 → 8 tools only if Gate C production proof passed;
- update video only if Gate D passed;
- preview all links and text.

## Rollback rule

If any promotion gate fails, keep the currently submitted/public version intact. Never trade a valid submitted entry for an unverified optimization.
