# Examples

**Last updated:** 2026-05-06

These examples show how to use Aici as a release gate for LLM behavior.

Start with provider-free fixture tests:

```bash
npx @mgicloud/aici run --config examples/basic/aici.yml
npx @mgicloud/aici run --config examples/tool-call/aici.yml
```

Use live provider examples only when the relevant API key is available:

```bash
OPENAI_API_KEY=... npx @mgicloud/aici run --config examples/openai/aici.yml
ANTHROPIC_API_KEY=... npx @mgicloud/aici run --config examples/anthropic/aici.yml
```

For more guidance, see [docs/examples.md](../docs/examples.md).
