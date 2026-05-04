# Release Checklist

**Last updated:** 2026-05-05

## Before Publishing

- Run `npm run verify`.
- Run `npm pack --dry-run` and inspect packaged files.
- Verify the GitHub Action in a real pull request.
- Verify one live OpenAI text-output test.
- Verify one live OpenAI tool-call test.
- Review `.aici/aici-report.json` for redaction behavior.
- Confirm README, quickstart, config reference, and changelog are current.

## V1 Launch Scope

- CLI.
- GitHub Action.
- Fixture output checks.
- Live provider checks.
- Structured output checks.
- Tool-call checks.
- Cost and latency guards.
- Markdown, JSON, and HTML reports.
- Templates and docs.

## Explicitly Not V1

- Hosted dashboards.
- User accounts.
- Billing.
- Prompt log storage.
- Enterprise policy engine.
- Managed eval dataset marketplace.
