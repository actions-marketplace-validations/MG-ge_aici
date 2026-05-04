# Roadmap

**Last updated:** 2026-05-05

---

## First 30 Days — Build the Useful CLI

### Goal

Ship a local CLI that can run real LLM regression tests and generate a report.

### Milestones

**Week 1**

- scaffold TypeScript CLI
- implement config parser
- implement `aici init`
- implement `aici validate`

**Week 2**

- implement `aici run`
- implement deterministic checks
- implement OpenAI provider
- implement basic pricing table

**Week 3**

- implement JSON schema checks
- implement cost and latency thresholds
- generate Markdown and JSON reports

**Week 4**

- create sample repo
- write README/docs
- test local install flow

### Exit criteria

- one developer can run the CLI against a real prompt and get a pass/fail report

---

## Days 31-60 — Make It CI-Native

### Goal

Ship the GitHub Action and template packs.

### Milestones

**Week 5**

- build GitHub Action wrapper
- upload reports as artifacts
- preserve CLI exit code

**Week 6**

- implement PR comment support
- polish report formatting
- add structured JSON extraction template pack

**Week 7**

- add support bot template pack
- add tool-call agent template pack
- add OpenAI-compatible provider mode

**Week 8**

- publish npm package
- publish GitHub Action
- prepare launch assets

### Exit criteria

- product works in a public sample repo and produces a useful PR comment

---

## Days 61-90 — Launch and Measure

### Goal

Launch the open-source product and measure repeated use.

### Milestones

**Week 9**

- launch on GitHub
- post technical demo article
- publish GitHub Marketplace listing if ready

**Week 10**

- collect issues and fix install friction
- add examples based on user questions

**Week 11**

- add Anthropic or Gemini provider if requested
- improve flaky-test controls

**Week 12**

- decide whether hosted history is justified
- decide whether template packs are worth monetizing

### Exit criteria

- repeated CI usage in real repos
- clear signal on paid feature demand

---

## Post-90 Days

Build hosted features only if adoption supports them:

- hosted run history
- trend charts
- Slack alerts
- team projects
- private templates

Do not build a broad observability platform unless users repeatedly ask for deeper runtime monitoring.
