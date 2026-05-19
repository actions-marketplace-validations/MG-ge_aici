# Roadmap

Aici is intentionally narrow: a local-first PR contract gate for AI output and release confidence. The core CLI and GitHub Action stay free and no-phone-home.

## Current

- Fixture-first checks for JSON schema, text, regex, tool calls, latency, and cost.
- OpenAI, Anthropic, and OpenAI-compatible provider support.
- Provider endpoint audit and allowlist checks.
- Markdown, JSON, and HTML reports.
- Bundled GitHub Action that runs without installing or building the CLI by default.
- Docker strict-mode examples for network-isolated fixture checks.

## Near Term

- One canonical public demo repo with a real blocked PR once GitHub Actions quota is available.
- More copy-paste examples for common app shapes: support bots, extractors, JSON API wrappers, and tool-calling agents.
- Clearer setup guides for trusted live checks versus untrusted PR fixture checks.
- Small release-artifact gate for npm package hygiene: fail on source maps, embedded sources, private prompts, env files, keys, and unexpected package contents.

## Later, Demand-Gated

- Additional provider examples where users ask for them.
- Private template packs for repeated implementation patterns.
- Paid setup/support for teams that want a working PR gate, first fixtures, endpoint allowlists, and CI handoff docs.

## Non-Goals

- Hosted tracing or production observability.
- Prompt management, datasets, or broad eval dashboards.
- LLM-as-judge scoring as the default path.
- Red-team suites or vulnerability scanning engines.
- A cloud backend required to use the CLI or Action.
