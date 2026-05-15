# Public Validation Targets

Collected on 2026-05-06 from public GitHub repo, code, and workflow search.

Purpose: find developers and teams already exposing LLM eval, Promptfoo, DeepEval, LangSmith, agent, RAG, or AI CI workflows. This is a validation map, not a spam list. Use public contact surfaces respectfully, and only open GitHub issues when the project explicitly invites tool feedback or the message is directly relevant to their repo.

## Validation Question

Use one core question:

> I am building Aici, a tiny no-phone-home AI quality gate for PRs. It checks JSON/tool-call/output contracts in CI and can audit every network endpoint it may call. Is eval-data privacy or PR safety a real issue for your workflow, or is that not a problem you would switch tools for?

Strong signal:

- They ask for the repo/package.
- They describe a concrete Promptfoo/DeepEval/LangSmith pain.
- They say they would try it in CI.
- They mention security review, untrusted PRs, private prompts, regulated data, or model-vendor neutrality.

Weak signal:

- "Cool idea."
- They only want dashboards, hosted history, broad red teaming, or Python eval metrics.
- They are evaluating toy/tutorial repos with no production workflow.

## Tier 1 Targets

These have the best fit for the no-phone-home PR quality-gate wedge.

| Target | Public signal | Why it fits | First ask |
| --- | --- | --- | --- |
| [smartcontractkit/chainlink-agent-skills](https://github.com/smartcontractkit/chainlink-agent-skills/blob/fa0d77aaff786e5452893c5ee0a0a81d63eed5e8/.github/workflows/eval.yml) | Prompt/eval GitHub workflow | Crypto infra, agent skills, CI gate, likely security-sensitive | "Do you care that eval tools may call non-provider backends during CI?" |
| [BillionsNetwork/verified-agent-identity](https://github.com/BillionsNetwork/verified-agent-identity/blob/0d6cf875810ac43a114e3ce28f0ee940ac35229e/.github/workflows/evaluate-skill.yml) | Eval workflow and Promptfoo config | Agent identity is a natural trust/audit buyer | "Would an endpoint-auditable AI gate help your agent identity workflow?" |
| [Uniswap/uniswap-ai](https://github.com/Uniswap/uniswap-ai/blob/b1e4f601961f4daf293cc4ce963f4865099aecb5/evals/templates/suite/promptfoo.yaml.template) | Promptfoo eval template | Financial/crypto AI, strong privacy/security context | "Are PR-time AI contract tests enough, or do you need full eval platform features?" |
| [pendle-finance/pendle-ai](https://github.com/pendle-finance/pendle-ai/blob/ce4eb359760af45b6dbd938b004dc3a3d2a221f5/evals/promptfoo.yaml) | Promptfoo eval config | Finance/crypto AI project using eval config | "Would a smaller no-phone-home eval gate be appealing, or is Promptfoo breadth necessary?" |
| [SuffolkLITLab/FormFyxer](https://github.com/SuffolkLITLab/FormFyxer/blob/b90728c84f13c7b24f0b47e0c368d4708a20db0e/promptfooconfig.yaml) | Promptfoo config | Legal-tech/doc automation; sensitive data context | "Would you run live evals in PRs if the tool proved no backend/telemetry calls?" |
| [University-of-Hawaii-Cancer-Center/AI-DEVSECOPS-UHCC](https://github.com/University-of-Hawaii-Cancer-Center/AI-DEVSECOPS-UHCC/blob/7e9940e4e60de8dca3e4f402548a97b16d2edc48/.github/workflows/ml-ops-pipeline.yml) | AI DevSecOps workflow | Healthcare/security-adjacent AI workflow | "Is auditable network behavior important for AI CI in healthcare/security contexts?" |
| [llmsecops-hyl/llmsecops](https://github.com/llmsecops-hyl/llmsecops/blob/2d51c4a5daa21515696d21e212f739eeb7a55076/.github/workflows/promptfoo-eval.yml) | Promptfoo eval workflow | Direct LLM security/DevSecOps audience | "Do you need local-first AI gates, or is hosted/broad tooling acceptable?" |
| [navapbc/labs-decision-support-tool](https://github.com/navapbc/labs-decision-support-tool/blob/d5f33ed58baa206639ac8474c34bb1c1c7e29992/.github/workflows/promptfoo-googlesheet-evaluation.yml) | Promptfoo GitHub workflow | Public-interest/government-adjacent decision support | "Would a simple audit output for provider endpoints help your security review?" |
| [howard768/ai-health-coach](https://github.com/howard768/ai-health-coach/blob/1d985bc8d133712a0807a386e6a61d1174444b1b/.github/workflows/eval.yml) | AI eval workflow | Healthcare app context; privacy angle likely relevant | "Is eval-data privacy a real constraint for health-related AI projects?" |
| [Tharanitharan-M/AuditPilot](https://github.com/Tharanitharan-M/AuditPilot/blob/944feb02526707c205cd4fdf9ab96b04ec1ea294/.github/workflows/eval.yml) | Eval workflow | Audit domain and PR-gate relevance | "Would a CI artifact showing every possible network call be useful?" |

## Tier 2 Targets

Good targets, but either broader, less security-sensitive, or harder to reach.

| Target | Public signal | Why it fits | First ask |
| --- | --- | --- | --- |
| [chromium/chromium](https://github.com/chromium/chromium/blob/65902f133871e91183bc12d6831b7f6217765911/agents/prompts/eval/fuzzing/eval.promptfoo.yaml) | Promptfoo eval config | Very strong signal, but too large for direct cold validation | Watch for related issues/discussions; use as proof that agent prompt evals are real |
| [superdoc-dev/superdoc](https://github.com/superdoc-dev/superdoc/blob/b26d9e45df39397787b9ea57691e57ebf67b9d53/evals/config/tool-quality.promptfoo.yaml) | Tool-quality Promptfoo evals | Tool-call/output quality focus maps well to Aici | "Are deterministic tool-call contract checks enough for your CI use case?" |
| [kodustech/kodus-ai](https://github.com/kodustech/kodus-ai/blob/850741744d049a5f791ad2698e5674bcb2638bce/evals/promotion/promptfoo.yaml) | Promptfoo evals | AI code-review product; PR-native angle likely familiar | "Would PR-native no-phone-home evals matter for code-review AI?" |
| [microsoft/vscode-azureapicenter](https://github.com/microsoft/vscode-azureapicenter/blob/ce0f7acfae307c4b4eec909fb2ba0205baef5b0c/.github/workflows/evalprompt.yml) | Prompt eval workflow | Enterprise devtool context; hard to reach but useful benchmark | Watch issues/discussions; do not pitch randomly |
| [checkmate-sg/ai-monorepo](https://github.com/checkmate-sg/ai-monorepo/blob/2d5c32a3a31a0489ff5e7277718c9351ac33e710/.github/workflows/eval.yml) | Eval workflow | AI monorepo with CI evals | "Does current eval CI feel too heavy for PR checks?" |
| [nchouser54/aws-agentic-ai-bedrock](https://github.com/nchouser54/aws-agentic-ai-bedrock/blob/3db76c6f93c3ceed2b9546b71c59948f505eed9d/.github/workflows/prompt-evals.yml) | Agentic AI + Promptfoo evals | AWS Bedrock/agentic context, likely provider-boundary concerns | "Do you need a provider endpoint audit for Bedrock/agent evals?" |
| [phrazzld/glance](https://github.com/phrazzld/glance/blob/7715982026fb5d000836b0373c7c1088c8f7489c/.github/workflows/eval-nightly.yml) | Nightly eval workflow | Already treats evals as CI/automation | "Would PR-fast fixture checks complement nightly live evals?" |
| [happybits/funnel](https://github.com/happybits/funnel/blob/8ecb59baab37bf3a5f59208d1630dcf73487106e/server/promptfoo/promptfooconfig.yaml) | Server-side Promptfoo config | Product/server workflow, likely wants low-friction checks | "Is Promptfoo overkill for simple output contract checks?" |
| [cduggn/sub-visual](https://github.com/cduggn/sub-visual/blob/8dd5c1e53737e167eae3c277c457c2804b1072e8/evals/repo-check/promptfooconfig.yaml) | Repo-check Promptfoo eval | Code/repo-checking agent workflow | "Would local PR contract tests be easier to trust than remote eval services?" |
| [pyrotank41/FinanceEscroAIAgent](https://github.com/pyrotank41/FinanceEscroAIAgent/blob/5b79f9b79349e8397cf9df8da42201de1caad2aa/prompt_eval_cloud/promptfooconfig.yaml) | Finance agent Promptfoo config | Finance domain, agent workflow | "Is privacy/no-phone-home a blocker or just nice-to-have?" |

## Tier 3 Targets

Useful for learning market language, but lower priority for direct outreach.

| Target | Public signal | Why it fits |
| --- | --- | --- |
| [AgentEvalHQ/AgentEval](https://github.com/AgentEvalHQ/AgentEval) | .NET agent eval framework | Adjacent competitor/collaborator; good positioning reference |
| [Magical-Bear/langchain-mcp-deepeval-trajectory-eval](https://github.com/Magical-Bear/langchain-mcp-deepeval-trajectory-eval) | DeepEval trajectory eval demo | Good for testing "outcome not trajectory" messaging |
| [droideronline/pyconf-hyd-2026-trustworthy-llm-agents](https://github.com/droideronline/pyconf-hyd-2026-trustworthy-llm-agents) | Workshop with observability/evals/security | Likely friendly educational audience |
| [rsfl/splunk-mcp-llm-siemulator](https://github.com/rsfl/splunk-mcp-llm-siemulator) | SIEM + MCP + Promptfoo OWASP evals | Security-oriented workflow; may care more about red-team breadth |
| [meghnadh7/aegis-graph](https://github.com/meghnadh7/aegis-graph) | SOC triage copilot with LangSmith eval harness | Strong agent/security context, but no direct Promptfoo signal |
| [faisalx96/qym](https://github.com/faisalx96/qym) | Langfuse + DeepEval evaluation framework | Good for understanding Python/observability buyer objections |
| [gaudiy/langsmith-evaluation-helper](https://github.com/gaudiy/langsmith-evaluation-helper) | Config-driven LangSmith eval helper | Validates config-first eval demand |
| [mark-burg/llm-petting-zoo](https://github.com/mark-burg/llm-petting-zoo) | LLM model comparison workflow | Useful if Aici later adds matrix/model comparison |
| [VectorInstitute/linguamark](https://github.com/VectorInstitute/linguamark/blob/bcc1c90c17a63b2dc6d9170af388b233f7e64554/src/metrics/run_deepeval.py) | DeepEval usage in benchmark code | Research/benchmark context, less PR-gate focused |
| [HugoDeBosschere/Medical_agent](https://github.com/HugoDeBosschere/Medical_agent/blob/05ed94b6544efccd9ed12c8d0fb70b6b1a8ed8f6/src/npr/ollama_call.py) | Medical agent code surfaced in eval search | Privacy-sensitive domain; inspect before outreach |

## Public Discussions To Monitor

| Target | Why |
| --- | --- |
| [promptfoo/promptfoo issue #2051](https://github.com/promptfoo/promptfoo/issues/2051) | Privacy/default data transmission complaint; validates no-phone-home concern |
| [promptfoo/promptfoo issue #5808](https://github.com/promptfoo/promptfoo/issues/5808) | "100% local" / remote API concern; validates auditability messaging |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo/issues) | Watch for CI friction, telemetry, provider, red-team, and config-complexity issues |
| [confident-ai/deepeval](https://github.com/confident-ai/deepeval/issues) | Watch for cost, judge-model, telemetry, CI, and hosted/cloud friction |
| [langchain-ai/langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk/issues) | Watch for eval workflow and hosted-data concerns |

## Search Recipes

Repeat these monthly:

```sh
gh search code 'filename:promptfooconfig.yaml' --limit 100 --json path,repository,url
gh search code 'filename:promptfoo.yaml' --limit 100 --json path,repository,url
gh search code 'promptfoo eval path:.github/workflows' --limit 100 --json path,repository,url
gh search code 'deepeval test_ extension:py' --limit 100 --json path,repository,url
gh search repos 'langsmith eval' --limit 50 --json fullName,description,url,stargazersCount,pushedAt,language
gh search issues 'promptfoo telemetry privacy local' --limit 50 --json title,url,repository,state,updatedAt
```

## Outreach Snippets

Short GitHub/social message:

> I found your public eval setup while researching AI CI workflows. I am building Aici, a tiny no-phone-home AI quality gate for PRs: fixture-first contract checks, live provider smoke tests, reports, and an audit command that prints every endpoint it may call. Is eval-data privacy / PR safety a real concern for your setup, or would that not change your tooling choice?

Follow-up if they ask what is different:

> The narrow bet is not "better eval platform." It is "small enough to audit, no telemetry, no backend, safe defaults for untrusted PRs, and contract checks that fail the PR." I am trying to learn whether that is a real wedge or just a nice slogan.

Request for trial:

> If you are open to it, I can send a 5-minute fixture-only setup. It does not need provider keys. The useful feedback is whether the config/report/CI failure are clear enough to trust.
