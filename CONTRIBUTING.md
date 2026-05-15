# Contributing

Thanks for helping make Aici better.

## Useful Commands

```bash
npm install
npm run verify
npm run security:audit
```

Before opening a PR, run:

```bash
npm run verify
npm run security:audit
npm pack --dry-run
```

## Development Guidelines

- Keep the CLI local-first and no-phone-home.
- Keep fixture tests deterministic.
- Do not add a hosted backend dependency to core checks.
- Treat provider endpoints and provider secrets as security-sensitive.
- Add tests for config validation, provider behavior, report output, or CI behavior when touching those surfaces.
- Keep docs updated with behavior changes.

## Security-Sensitive Changes

Use extra care for changes that touch:

- provider request URLs
- provider API-key handling
- report generation or redaction
- config file path resolution
- GitHub Action shell scripts
- artifact upload or PR comments

Do not put real secrets, private prompts, customer data, or unredacted provider payloads in tests, fixtures, issues, or PRs.

## Issue Reports

For bugs, include:

- Aici version
- Node.js version
- sanitized `aici.yml`
- exact command
- expected behavior
- actual behavior

For product feedback, describe what you are trying to gate in CI and what made the setup confusing or insufficient.
