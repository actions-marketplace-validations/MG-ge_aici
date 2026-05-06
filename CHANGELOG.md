# Changelog

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
