# Changelog

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
