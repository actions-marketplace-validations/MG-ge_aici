# Changelog

## 0.1.3 - 2026-05-15

- Added endpoint allowlist enforcement to `aici run`, so live jobs can reject unapproved provider endpoints before provider API keys are read.
- Added a GitHub Action `allowed-provider-endpoints` input that passes the same preflight policy to live runs.
- Enforced runtime provider request URL matching against the audited endpoint for Aici's own provider calls.
- Hardened `openai-compatible` `baseUrl` validation: remote endpoints must use HTTPS, while HTTP remains allowed for localhost and loopback local-model endpoints.
- Rejected provider base URLs containing credentials, query strings, or fragments.
- Added regression tests for endpoint preflight, local HTTP compatibility, and remote HTTP rejection.

## 0.1.2 - 2026-05-15

- Added `aici audit` with human and JSON output for provider endpoints, empty judge endpoints, runtime dependencies, source summary, and network policy.
- Added `--allow-provider-endpoint` so CI can fail on unapproved provider endpoints.
- Documented the provider/judge network boundary and the limits of static audit versus runner-level egress controls.
- Repositioned docs and the landing page around local-first, no-phone-home AI quality gates for pull requests.
- Added a real proof GIF built from local CLI, GitHub Action, and HTML report screenshots.
- Added public validation targets and outreach prompts for user discovery.

## 0.1.1 - 2026-05-06

- Hardened provider config so official OpenAI and Anthropic providers always use official endpoints and reject `baseUrl`.
- Kept custom `baseUrl` support scoped to `openai-compatible` providers.
- Added config and provider tests for allowed and rejected endpoint cases.
- Expanded redaction to recursively cover tool-call arguments and raw provider payloads in reports.
- Added a GitHub Action guard for provider secrets on untrusted pull-request configs.
- Added npm audit, Dependency Review, CodeQL, Dependabot, Cloudflare Pages headers, and package security metadata.
- Added landing-page favicon, social preview image, and product-proof screenshots.

## 0.1.0 - 2026-05-06

- Added TypeScript CLI with `init`, `validate`, `schema`, and `run`.
- Added deterministic fixture tests for text output and normalized tool calls.
- Added OpenAI Responses and OpenAI-compatible chat-completions provider adapters.
- Added Anthropic Messages provider adapter.
- Added live function-tool request support with `tools` and `toolChoice`.
- Added checks for exact match, contains, regex, JSON parse, JSON Schema, tool calls, latency, and known cost.
- Added secret redaction for provider keys, bearer/API-key patterns, and configured strings.
- Added Markdown, JSON, and HTML reports.
- Added GitHub composite action with job summary, artifact upload, and optional sticky PR comment.
- Added config-root file boundary checks for file-backed prompts, fixtures, schemas, and tool parameter files.
- Hardened composite action shell input handling.
- Added config JSON Schema, examples, templates, and release docs.
