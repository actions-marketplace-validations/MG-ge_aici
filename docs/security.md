# Security

**Last updated:** 2026-05-06

## V1 Security Model

Aici is designed as a local/CI-first tool. It does not require hosted storage, hosted prompt logs, or a backend service in v1.

## Secrets

- API keys are read from environment variables named by `provider.apiKeyEnv`.
- Reports never intentionally include request headers.
- Provider error bodies are redacted before being written to result messages.
- Common bearer-token and API-key patterns are redacted automatically.
- Additional strings can be configured with top-level `redact`.

```yaml
version: 1
redact:
  - customer@example.com
  - tenant-123
```

## CI Artifacts

The generated JSON report can include model output. If your prompts include sensitive customer data, add redaction entries or avoid uploading artifacts for those jobs.

Config-referenced files are constrained to the config directory. Keep prompts, fixtures, schemas, and tool schemas under that directory instead of pointing configs at parent folders or machine-local files.

Recommended defaults:

- Use fixture outputs for broad regression coverage.
- Use live provider calls only for smoke tests and critical prompts.
- Keep provider keys in GitHub Actions secrets.
- Disable PR comments for private or sensitive outputs.
- Review `.aici/aici-report.json` before enabling artifact upload on real customer data.

## Non-Goals In V1

- No hosted prompt storage.
- No multi-tenant backend.
- No production secrets manager.
- No compliance certification claim.
- No guarantee that provider-side error bodies omit all sensitive data before local redaction.
