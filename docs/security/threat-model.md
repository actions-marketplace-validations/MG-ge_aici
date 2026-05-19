# Security Threat Model

## Overview

Aici is a Node.js CLI and composite GitHub Action for local-first AI output contract gates. Users run it locally or in CI to validate fixture outputs or live model responses against text, regex, JSON Schema, tool-call, latency, cost, and provider endpoint expectations. The primary runtime entry point is the CLI in `src/cli.ts`, exposed as the `aici` binary by `package.json`. The GitHub Action in `action.yml` wraps the bundled CLI artifact at `action-dist/cli.js` and can append job summaries, optionally upload reports, and optionally create/update a sticky pull request comment.

Production/runtime code is the TypeScript CLI under `src/`, the bundled Action path under `action-dist/cli.js`, the published JavaScript under `dist/`, the PR-comment helper `scripts/upsert-pr-comment.mjs`, the composite Action `action.yml`, and the package metadata that controls npm publication. The static site under `site/` is a marketing/docs surface hosted on Cloudflare Pages; it has no application backend, no authentication, and no API routes. The docs, examples, templates, schemas, and tests are developer-facing, but examples and templates influence user configs and therefore affect security assumptions.

Aici has no hosted Aici backend, no telemetry service, no database, no user accounts, no sessions, no tenants, no payment flow, no email service, no upload/download API, and no long-running server process. Fixture tests run entirely against local files. Live provider tests send configured prompts, inputs, tool definitions, and provider credentials to OpenAI, Anthropic, or an explicitly configured OpenAI-compatible endpoint. Reports are local files by default, but the GitHub Action can expose them to GitHub job summaries, PR comments, or artifacts depending on Action inputs.

## Threat Model, Trust Boundaries, and Assumptions

Assets and privileges that matter:

- Provider API keys in environment variables such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or custom `provider.apiKeyEnv` values. Runtime provider clients read these from `process.env` in `src/providers.ts`.
- Prompt text, inputs, fixtures, tool schemas, tool-call arguments, model outputs, failure messages, cost/latency data, and generated reports. These may contain customer data or internal product behavior even though Aici itself does not require it.
- GitHub workflow privileges, especially `GITHUB_TOKEN` permissions used by `scripts/upsert-pr-comment.mjs` to list, create, and update issue comments.
- Repository and release integrity: the npm package includes `dist`, `action-dist`, docs, examples, templates, schemas, the Action manifest, and the PR-comment script through `package.json` package `files`.
- CI trust decisions: whether a failing Aici run blocks merge, whether live provider checks run on untrusted PRs, and whether reports are visible to reviewers or stored as artifacts.
- This repository's own CI integrity: `.github/workflows/ci.yml` runs verification and an Action smoke test on pull requests, while `.github/workflows/security.yml` runs npm audit, dependency review, and CodeQL. These workflows should not expose live provider secrets to pull-request code.

User and service roles:

- Repository maintainers configure `aici.yml`, choose GitHub Action inputs, decide whether provider secrets are available, and decide whether reports are uploaded/commented.
- Contributors and PR authors can control repo content in their branch, including Aici config, prompt files, schema files, fixture files, and tool definitions when a workflow checks out their branch.
- CI runners execute the Action and CLI. GitHub provides job summary, artifact, and issue-comment storage when those features are enabled.
- Model providers receive live-check prompts, inputs, tool definitions, and API credentials for the configured endpoint.
- Package consumers run the published CLI from npm or the GitHub Action by tag.
- Attackers include malicious PR authors, compromised maintainer accounts, compromised provider-compatible endpoints, compromised dependencies, and users who feed Aici untrusted configs or fixtures.

Trust boundaries:

- Local developer machine to Aici CLI: command-line arguments such as `--config`, `--report-dir`, and `--allow-provider-endpoint` are operator-controlled in normal use but can be attacker-influenced in generated CI configs.
- Config directory to file system: `promptFile`, `inputFile`, `mockOutputFile`, `mockToolCallsFile`, `jsonSchema`, and tool `parametersFile` are read from local disk. `src/paths.ts` constrains these references to stay inside the config directory.
- YAML/JSON config to runtime execution: `src/config.ts` validates config shape, provider type, provider base URL rules, tool definitions, and expectation types before execution.
- CLI to model provider: live checks cross the network boundary in `src/providers.ts`. `src/provider-endpoints.ts` fixes official OpenAI and Anthropic endpoints, requires `baseUrl` only for `openai-compatible`, rejects credentials/query/fragments in compatible base URLs, and allows plain HTTP only for localhost/loopback local model endpoints.
- CLI to reports: `src/report.ts` writes Markdown, JSON, and HTML reports. Reports may carry model output and tool-call details after redaction. The report directory is operator-controlled via `--report-dir` or Action input.
- Action to GitHub storage: `action.yml` appends Markdown to the job summary by default, uploads artifacts only when `upload-artifact: true`, and creates PR comments only when `pr-comment: true`.
- Action to GitHub API: `scripts/upsert-pr-comment.mjs` shells out via `execFile` to `gh api` to read and write issue comments using the workflow token.
- Repository to npm/GitHub Marketplace: maintainers publish package contents and release tags. Consumers trust those release artifacts.
- Pull-request code to this repository's own CI: PR authors can alter source, package scripts, `action.yml`, and workflow files in their branch. The repository's own pull-request workflows must be treated as untrusted-code execution and should avoid provider secrets and high-privilege tokens.
- Static site to browser: `site/index.html` and assets are static. `site/_headers` sets HSTS, nosniff, frame-denial, permissions policy, CSP with `connect-src 'none'`, and other headers. There is no server-side site runtime.

Attacker-controlled inputs:

- Pull request changes to `aici.yml`, prompt/input files, JSON schemas, tool parameter schemas, fixtures, tool-call fixtures, docs/examples copied into workflows, and Action workflow YAML in repos that use Aici.
- Model provider responses and provider error bodies during live checks.
- Values embedded in model output, normalized tool-call arguments, and raw provider payload fragments that may later appear in reports.
- Regex strings in expectations and JSON Schemas used by local checks.
- GitHub issue comment bodies already present on a PR when the sticky comment helper searches for an existing bot comment marker.
- OpenAI-compatible `baseUrl` values in configs where compatible providers are allowed.

Operator-controlled inputs:

- CLI arguments, report directory, config path, endpoint allowlist, environment variables containing provider keys, and release/publish commands.
- GitHub Action inputs: `config`, `report-dir`, `install`, `build`, `comment`, `pr-comment`, `upload-artifact`, `allow-provider-secrets`, `provider-secret-envs`, and `allowed-provider-endpoints`.
- CI workflow permissions, branch protection, fork/PR policies, artifact retention, and provider-secret placement.

Developer-controlled inputs:

- Source code, tests, generated `dist` files, generated `action-dist/cli.js`, package metadata, examples, templates, docs, CI workflows, and Cloudflare Pages static assets.
- Dependency versions in `package-lock.json` and runtime package contents published to npm.

Authentication, authorization, session, and tenant assumptions:

- Aici itself has no authentication, authorization, session, or tenant model because it is a local CLI/GitHub Action rather than a hosted service.
- Tenant isolation is the responsibility of the repository and CI environment where Aici runs. If a multi-tenant product uses Aici fixtures or prompts, that product must prevent cross-tenant data from entering configs, prompts, reports, or public artifacts.
- GitHub token scope is determined by the calling workflow. Aici’s PR-comment helper assumes the token can list and write issue comments only when `pr-comment: true` and appropriate permissions are configured.

Secrets and credential assumptions:

- Provider API keys are supplied by environment variables and should be GitHub Actions secrets or local environment secrets. They are not stored by Aici.
- The CLI must not read provider keys before endpoint allowlist checks complete when `--allow-provider-endpoint` is used. `src/cli.ts` builds an audit report and asserts endpoint allowlists before `runConfig`.
- The GitHub Action’s provider secret guard blocks pull-request events when guarded provider secret env vars are present unless `allow-provider-secrets: true`.
- Redaction in `src/redaction.ts` covers configured redaction strings, common provider key environment values, common bearer tokens, and common key-like patterns. This reduces but does not eliminate report leakage risk.

Unknowns that need confirmation:

- Whether downstream users will run Aici in public fork PRs, private repos, or self-hosted runners.
- Whether downstream users will put production prompts, customer data, or proprietary tool schemas into live provider checks.
- Whether downstream users will enable job summaries, PR comments, or artifacts for sensitive reports.
- Whether future versions will add release-artifact gates, LLM-as-judge, additional providers, or hosted functionality. Those would add new trust boundaries.

## Attack Surface, Mitigations, and Attacker Stories

Public endpoints, APIs, webhooks, uploads, downloads, and background jobs:

- There are no Aici-hosted public HTTP endpoints, APIs, webhooks, file uploads, file downloads, queues, background workers, or database jobs in this repository.
- The Cloudflare Pages site is static and should be treated as a public marketing/docs surface only. Its security posture depends mainly on static asset integrity and headers in `site/_headers`.

CLI and local runtime surfaces:

- `aici init` writes starter config, fixture, and schema files. Without `--force`, it uses exclusive file creation and refuses to overwrite existing files.
- `aici validate` reads and validates a config.
- `aici audit` reads a config, prints configured provider endpoints, dependency metadata, source summary, and network-policy flags.
- `aici schema` prints the JSON schema.
- `aici run` reads configs and referenced local files, optionally checks provider endpoint allowlists, runs fixture or live provider checks, writes reports, and exits non-zero when checks fail.

File parsing and file-system access:

- YAML config parsing occurs in `src/config.ts`. JSON parsing occurs for mock tool calls, JSON Schemas, tool parameter schemas, and provider responses.
- Config-referenced file paths are constrained by `src/paths.ts` to stay inside the config directory. This is a core mitigation against arbitrary file read from `../../`, home directories, sibling repos, or CI workspace secrets.
- Report output paths are operator-controlled and are not restricted to the config directory. This is expected for CLI tooling, but workflows should not pass attacker-controlled `report-dir` values in privileged jobs.
- HTML report rendering escapes test names, provider/model labels, tool-call names, and failure messages before inserting them into HTML. Markdown report rendering escapes table separators and newlines but does not sanitize all Markdown semantics because GitHub Markdown rendering is delegated to GitHub.

Network fetches:

- Live provider calls are the main intentional network egress. Official `openai` and `anthropic` provider types use fixed official endpoints. Only `openai-compatible` accepts a `baseUrl`.
- Compatible `baseUrl` normalization rejects credentials, query strings, fragments, non-HTTPS remote URLs, and permits plain HTTP only for localhost/loopback.
- `aici audit` and `aici run --allow-provider-endpoint` can enforce endpoint allowlists before provider keys are read.
- Aici is not a process-level network sandbox. Other commands in the same CI job can still make arbitrary network calls unless the runner/container/firewall controls egress.

Shell/process execution:

- The core CLI does not execute shell commands from config.
- The composite Action shell script runs fixed shell snippets from `action.yml`. Action inputs feed config/report paths and endpoint allowlist values; they should be treated as operator-controlled.
- `scripts/upsert-pr-comment.mjs` executes `gh api` through `execFile`, not a shell, to list and update comments. It still sends Markdown report content to GitHub when PR comments are enabled.
- Package scripts in `package.json` are developer/release tooling. They include build, test, sample, schema-check, and npm audit commands. They are not invoked by the Action on release tags unless `install: true` or `build: true` is explicitly set.
- In this repository's own pull-request CI, `npm ci`, `npm run verify`, and `uses: ./` execute code from the checked-out PR. That is expected for CI, but those jobs should stay secret-free and low-privilege.

Deserialization, regex, and schema evaluation:

- Provider responses and fixture files are parsed as JSON where required. JSON parse failures become failed checks rather than code execution.
- JSON Schema validation uses Ajv 2020 over schemas from the config directory. Future scans should consider schema complexity and denial-of-service risk if untrusted users can submit large or pathological schemas.
- Regex expectations are compiled with JavaScript `RegExp`. If untrusted PR authors can control regexes in workflows that must complete quickly, catastrophic backtracking is a realistic denial-of-service class.

Reports and data exposure:

- Reports may include model output and normalized tool-call data. `src/redaction.ts` recursively redacts configured strings and common secret patterns before reports are written.
- GitHub job summary output is enabled by default in the Action. PR comments and artifact upload are opt-in. Sensitive repos should disable `comment`, avoid `pr-comment`, keep `upload-artifact: false`, and add `redact` values for sensitive identifiers.
- Provider error bodies are captured into execution failure messages and then redacted. This reduces risk from provider echoing request fragments or keys, but provider-specific response formats can still expose sensitive data if not covered by redaction.

Existing mitigations and controls:

- Strict provider typing rejects `baseUrl` for official OpenAI and Anthropic providers and requires `baseUrl` only for `openai-compatible`.
- Compatible provider URL normalization limits SSRF-like misconfiguration risk by requiring HTTPS for remote endpoints and rejecting credentials/query/fragments.
- Endpoint audit and allowlist enforcement fail before provider API keys are read when configured.
- File reference confinement limits arbitrary local file reads from config-referenced inputs.
- Action provider-secret guard blocks guarded provider secret env vars on pull-request events unless explicitly overridden.
- Action release tags run the bundled `action-dist/cli.js`, and `install`/`build` default to false.
- Artifact upload and PR comments are opt-in. Job summaries remain default for usability.
- Redaction covers configured values, provider env secret values, bearer tokens, API-key-like strings, model output, check messages, tool-call arguments, and raw tool-call payloads.
- CI includes `npm run verify`, npm audit, dependency review, and CodeQL workflows when GitHub Actions quota is available. Dependabot version-update PRs are currently paused with `open-pull-requests-limit: 0`.
- The static site sets restrictive headers, including `connect-src 'none'`, frame denial, HSTS, and object blocking.

Realistic attacker stories:

- A malicious PR author modifies `aici.yml` and prompt files to make a fixture-only check pass while weakening the gate. This is a product-integrity issue, usually Medium, and should be caught by code review and branch protection.
- A malicious PR author changes a live-check config to use `openai-compatible` with a remote endpoint they control, hoping the CI job sends provider prompts or API keys to that endpoint. This is High if maintainers expose secrets to untrusted PR configs. The intended mitigations are the Action provider-secret guard, trusted live workflows, endpoint allowlists, and base URL restrictions.
- A malicious PR author tries to read files outside the config directory by setting `promptFile: ../../secret`. This should be blocked by `src/paths.ts` and is Critical or High if a future regression bypasses that control in a secret-bearing CI job.
- A model provider or compatible endpoint returns output containing secrets, HTML, Markdown, or deceptive text that appears in reports or PR comments. Redaction and HTML escaping reduce risk; sensitive repos should avoid public comments/artifacts.
- A malicious or compromised dependency changes runtime behavior before publishing or during local development. This matters because Aici is an npm-distributed CLI and Action. Package lock review, npm audit, dependency review, CodeQL, and release tarball inspection are relevant controls.
- A malicious actor compromises a maintainer account or release workflow and publishes a package/tag with altered `dist` or `action-dist` artifacts. This is a release-integrity and supply-chain threat, not a normal runtime bug.
- A malicious PR to this repository changes package scripts, `action.yml`, or source code to execute during CI. This should not expose provider keys because live provider secrets are not required for pull-request verification, but it can still consume Actions quota or attempt to tamper with verification output.
- A malicious PR author introduces expensive or pathological regex/JSON Schema inputs to waste CI time. This is usually Medium or Low unless it reliably blocks protected branches or consumes meaningful CI quota.

Out-of-scope or low-realism attacker stories:

- Web auth bypass, CSRF, server-side request forgery against an Aici backend, SQL injection, tenant database escape, payment abuse, and server-side file upload abuse are out of scope for the current repository because there is no backend, database, session, payment flow, or upload endpoint.
- Browser XSS in the static marketing site is lower realism because the site is static and has no user-generated content path. Site asset compromise remains relevant as a supply-chain/deployment integrity issue.
- Privilege escalation between Aici users is out of scope inside the product itself because no hosted user model exists.

## Severity Calibration

Critical for this repo means a flaw that can directly compromise provider secrets, GitHub release/package integrity, arbitrary local files, or consumer execution at scale with little additional user mistake. Examples:

- A path-confinement bypass that lets an attacker-controlled config in CI read arbitrary workspace files or environment-derived secret files and include them in reports or provider prompts.
- A provider endpoint enforcement bypass that causes `type: openai` or `type: anthropic` to send provider API keys or prompts to an attacker-controlled endpoint.
- A release/publish compromise that ships a malicious `dist/cli.js`, `action-dist/cli.js`, or package script to npm or a GitHub Action tag.
- Command injection through config, Action inputs, or PR-comment handling that executes attacker-controlled shell commands on a CI runner with repository secrets.
- A pull-request workflow design flaw that exposes npm publish tokens, provider API keys, or write-scoped GitHub tokens to attacker-controlled code in this repository's own CI.

High means a flaw that exposes sensitive prompts, model outputs, tool definitions, provider keys, or GitHub write privileges in realistic CI usage, but usually requires a privileged workflow, explicit Action input, or sensitive repo configuration. Examples:

- Running live provider checks with secrets on untrusted PR configs where endpoint allowlists or the provider-secret guard can be bypassed or are misdocumented.
- Report redaction failure that exposes provider API keys, bearer tokens, customer identifiers, or raw tool-call payloads in GitHub job summaries, PR comments, or artifacts.
- A PR-comment helper issue that lets an attacker overwrite unrelated bot comments or write misleading trusted-looking reports through the workflow token.
- Accepting remote plain-HTTP or credential-bearing compatible provider URLs that leak prompts/API keys in transit or logs.

Medium means a flaw that weakens gate correctness, leaks non-secret internal information, causes bounded CI denial of service, or creates a security footgun that maintainers can reasonably avoid with documented configuration. Examples:

- Regex or JSON Schema complexity causing CI timeouts when PR authors can control expectations.
- Incorrect cost/latency accounting that lets a regression pass or causes avoidable provider spend without exposing secrets.
- Markdown report content that misleads reviewers or leaks non-sensitive model output when PR comments are enabled.
- Documentation or examples that encourage live provider secrets in untrusted PR workflows.
- A static site header regression that weakens browser isolation but does not expose user data because the site is static.

Low means a flaw with limited security impact, local-only annoyance, or developer-tool reliability risk. Examples:

- Help text, examples, or templates that are confusing but do not expose secrets or change runtime security controls.
- Local `aici init --force` overwriting files because the operator explicitly requested force.
- Incorrect report formatting, missing icons/assets, or inaccurate non-security metadata.
- CI workflow noise, stale Dependabot PRs, or failed optional checks that do not affect package/runtime integrity.
