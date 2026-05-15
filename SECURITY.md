# Security Policy

**Last updated:** 2026-05-15

## Supported Versions

Security fixes are currently provided for the latest published v0.x version.

| Version | Supported |
|---|---|
| 0.1.x | yes |

## Reporting A Vulnerability

Do not open a public issue for secrets, prompt leaks, CI artifact leaks, path traversal, arbitrary file read/write, command injection, dependency compromise, or provider-key handling bugs.

Report privately by emailing the maintainer or using GitHub private vulnerability reporting if it is enabled for the repository. Include:

- Affected version or commit.
- Minimal reproduction steps.
- Impact assessment.
- Whether credentials, prompts, outputs, reports, or CI artifacts are exposed.

Expected response target for v0.1 is best-effort within 7 days. This is a solo-maintained open-source project, not a certified security program.

## Security Model

Aici v0.1 is local/CI-first:

- No hosted Aici backend is required.
- No hosted prompt storage is used by Aici.
- Provider API keys are read from environment variables.
- Reports are written to the local filesystem or CI artifacts.
- Config-referenced files are constrained to the config directory.
- The GitHub Action blocks guarded provider secret env vars during pull-request events unless live checks are explicitly allowed for a trusted config.

See [docs/security.md](./docs/security.md) and [docs/data-handling.md](./docs/data-handling.md) for operational guidance.

## Out Of Scope

- Provider-side data retention guarantees.
- Security guarantees for prompts or outputs uploaded by your CI system.
- Compliance certification claims.
- Secrets already committed to your repository history.
