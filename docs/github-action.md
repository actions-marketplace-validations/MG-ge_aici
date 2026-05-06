# GitHub Action

**Last updated:** 2026-05-06

## Inputs

| Input | Default | Description |
|---|---|---|
| `config` | `aici.yml` | Path to config file |
| `report-dir` | `.aici` | Output directory for reports |
| `install` | `true` | Run `npm ci` |
| `build` | `true` | Run `npm run build` |
| `comment` | `true` | Append Markdown report to job summary |
| `pr-comment` | `false` | Add/update sticky PR comment |
| `upload-artifact` | `true` | Upload report directory |

## Minimal Workflow

```yaml
name: Aici

on:
  pull_request:

jobs:
  aici:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - uses: ./
        with:
          config: examples/basic/aici.yml
```

## PR Comments

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

```yaml
- uses: ./
  with:
    config: aici.yml
    pr-comment: true
```

The action uses a sticky marker so each PR has one updated report comment instead of a new comment on every run.
