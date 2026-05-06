# Security

**Last updated:** 2026-05-06

## V1 Security Model

Aici is designed as a local/CI-first tool. It does not require hosted storage, hosted prompt logs, or a backend service in v1.

For a concise data-flow explanation, see [Data Handling](./data-handling.md).

## Secrets

- API keys are read from environment variables named by `provider.apiKeyEnv`.
- Reports never intentionally include request headers.
- Provider error bodies are redacted before being written to result messages.
- Common bearer-token and API-key patterns are redacted automatically.
- Additional strings can be configured with top-level `redact`.
- Redaction is applied to model output, check messages, normalized tool-call arguments, and raw tool-call payloads before reports are written.

```yaml
version: 1
redact:
  - customer@example.com
  - tenant-123
```

## CI Artifacts

The generated JSON report can include model output and normalized tool-call details. If your prompts include sensitive customer data, add redaction entries or avoid uploading artifacts for those jobs.

Config-referenced files are constrained to the config directory. Keep prompts, fixtures, schemas, and tool schemas under that directory instead of pointing configs at parent folders or machine-local files.

Recommended defaults:

- Use fixture outputs for broad regression coverage.
- Use live provider calls only for smoke tests and critical prompts.
- Keep provider keys in GitHub Actions secrets.
- Do not run live checks with provider secrets against untrusted PR configs, prompts, schemas, or tool definitions. The GitHub Action defaults to blocking guarded provider secret env vars during pull-request events unless `allow-provider-secrets: true` is set.
- Disable PR comments for private or sensitive outputs.
- Review `.aici/aici-report.json` before enabling artifact upload on real customer data.

## Project Hardening

This repository includes GitHub workflows for:

- `npm audit --audit-level=moderate`.
- Dependency Review on pull requests.
- CodeQL JavaScript/TypeScript analysis.
- Dependabot updates for npm packages and GitHub Actions.

The static Cloudflare Pages site includes `site/_headers` for HTTPS, content-type, frame, permissions, referrer, and CSP headers.

## Threats Aici Tries To Reduce

- Silent prompt regressions that bypass normal unit tests.
- Broken JSON contracts reaching downstream code.
- Unexpected tool/function calls caused by prompt or model changes.
- Accidental config references to files outside the project.
- Secret leakage through common API-key and bearer-token patterns in reports.

## Threats You Still Own

- Prompt or output data sent to model providers in live checks.
- CI artifact visibility and retention.
- GitHub Actions secret permissions.
- Sensitive test fixtures committed to the repository.
- Provider-side logging, abuse monitoring, or retention behavior.

## Recommended Workflow For Sensitive Repositories

1. Use fixture tests for most coverage.
2. Run live checks only on sanitized prompts or non-production inputs.
3. Run provider-key workflows only after config changes are trusted.
4. Keep `upload-artifact: false` until reports are reviewed.
5. Keep `pr-comment: false` for private outputs.
6. Add `redact` entries for tenant ids, customer ids, and emails.

## Non-Goals In V1

- No hosted prompt storage.
- No multi-tenant backend.
- No production secrets manager.
- No compliance certification claim.
- No guarantee that provider-side error bodies omit all sensitive data before local redaction.
