# Troubleshooting

**Last updated:** 2026-05-15

## `aici run` Fails Right After `aici init`

Run both commands from the same directory:

```bash
npx @mgicloud/aici init --config aici.yml
npx @mgicloud/aici run --config aici.yml
```

`init` creates three files:

- `aici.yml`
- `aici-example.output.json`
- `aici-example.schema.json`

If one of those files is missing, rerun:

```bash
npx @mgicloud/aici init --config aici.yml --force
```

## `Missing API key env var`

The test is trying to call a live provider. Set the configured API key environment variable, or switch the test to fixture mode with `mockOutput`, `mockOutputFile`, `mockToolCalls`, or `mockToolCallsFile`.

OpenAI:

```bash
OPENAI_API_KEY=... npx @mgicloud/aici run --config aici.yml
```

Anthropic:

```bash
ANTHROPIC_API_KEY=... npx @mgicloud/aici run --config aici.yml
```

Do not paste raw API keys into issues, PR comments, or CI logs.

## `baseUrl is only allowed for openai-compatible providers`

`type: openai` always uses the official OpenAI endpoint. `type: anthropic` always uses the official Anthropic endpoint.

Use `type: openai-compatible` for custom gateways, local model servers, or third-party OpenAI-compatible APIs:

```yaml
provider:
  type: openai-compatible
  model: local-model
  baseUrl: http://localhost:11434/v1
```

Remote compatible endpoints must use HTTPS. Plain HTTP is allowed only for `localhost`, `127.0.0.1`, and loopback local-model endpoints.

## `unapproved provider endpoints`

The command was run with `--allow-provider-endpoint`, and the config contains a provider endpoint that is not on the allowlist.

Inspect the endpoint:

```bash
npx @mgicloud/aici audit --config aici.yml
```

Then either approve the endpoint explicitly:

```bash
npx @mgicloud/aici run \
  --config aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses
```

or change the config back to an approved provider.

## GitHub Action Blocks Provider Secrets On PRs

This is intentional. Aici blocks guarded provider secret env vars during `pull_request` and `pull_request_target` unless `allow-provider-secrets: true` is set.

For public repositories and forked PRs, keep the PR workflow fixture-only. Run live provider checks only from trusted branches, protected merge queues, scheduled jobs, or maintainer-approved workflows.

For trusted live checks:

```yaml
- uses: MG-ge/aici@v0.1.9
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: aici.yml
    allow-provider-secrets: true
    allowed-provider-endpoints: https://api.openai.com/v1/responses
```

## Reports Contain Sensitive Output

Reports can include model output and normalized tool-call arguments. Add known sensitive values to `redact`:

```yaml
version: 1
redact:
  - customer@example.com
  - tenant-123
tests:
  - name: support-response-schema
    mockOutputFile: aici-example.output.json
```

For sensitive workflows, disable PR comments and artifact upload until you have reviewed report contents.

## JSON Schema Failure Is Hard To Read

Aici prints AJV's validation summary. Make the failure easier to debug by:

- giving each test a specific `name`
- keeping schemas small at first
- adding `required` fields intentionally
- starting with one fixture before adding provider calls

Use the failing example to see the report shape:

```bash
npx @mgicloud/aici run --config examples/failing/aici.yml
```

## Need Help

Open a GitHub issue with:

- your Aici version
- Node.js version
- sanitized `aici.yml`
- the exact command
- the smallest sanitized prompt/output/schema that reproduces the issue

Do not include provider keys, customer data, private prompts, or unredacted reports.
