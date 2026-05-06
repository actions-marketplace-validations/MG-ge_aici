# Release Checklist

**Last updated:** 2026-05-06

## Before Publishing

- [x] Run `npm run verify`.
- [x] Run `npm pack --dry-run` and inspect packaged files.
- [x] Verify the GitHub Action in a real pull request.
- [x] Verify one live OpenAI text-output test.
- [x] Verify one live OpenAI tool-call test.
- [x] Verify one live Anthropic text-output test.
- [x] Verify one live Anthropic tool-call test.
- [x] Run the Codex Security scan checklist for CLI, GitHub Action, reports, and static frontend.
- [x] Add dependency scanning, Dependency Review, CodeQL, and Dependabot workflows.
- [x] Add Cloudflare Pages security headers.
- [x] Add package metadata pointing to the security policy.
- [x] Add favicon, OG/social image, and product-proof screenshots to the landing page.
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
