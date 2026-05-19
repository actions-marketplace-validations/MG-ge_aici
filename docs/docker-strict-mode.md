# Docker Strict Mode

**Last updated:** 2026-05-15

Use this when you want fixture checks to run with no network path at all.

## What This Proves

`docker run --network none` is a real process-level network boundary for the container. If a fixture-only Aici run passes in this mode, the check did not need outbound network access.

This is strongest for pull-request gates because fixture tests do not need provider API keys.

## Build The Fixture Image

Build once, with network access, so the image contains the published Aici CLI:

```bash
docker build \
  -f examples/docker/Dockerfile.fixture \
  --build-arg AICI_VERSION=0.1.9 \
  -t aici-fixture:0.1.9 \
  .
```

## Run Fixture Checks With No Network

```bash
mkdir -p .aici-docker

docker run --rm --network none \
  -v "$PWD:/work:ro" \
  -v "$PWD/.aici-docker:/reports" \
  -w /work \
  aici-fixture:0.1.9 \
  run --config aici.yml --report-dir /reports
```

The repository is mounted read-only. Reports are written to `.aici-docker/`.

For a specific example:

```bash
docker run --rm --network none \
  -v "$PWD:/work:ro" \
  -v "$PWD/.aici-docker:/reports" \
  -w /work \
  aici-fixture:0.1.9 \
  run --config examples/basic/aici.yml --report-dir /reports
```

## CI Shape

Use this as the pull-request job shape for strict fixture gates:

```yaml
jobs:
  aici-fixtures-offline:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
      - name: Build trusted Aici fixture image
        run: |
          docker build --build-arg AICI_VERSION=0.1.9 \
            -t aici-fixture:0.1.9 \
            - <<'DOCKERFILE'
          FROM node:22-alpine
          ARG AICI_VERSION=0.1.9
          RUN npm install --global "@mgicloud/aici@${AICI_VERSION}" \
            && npm cache clean --force
          WORKDIR /work
          ENTRYPOINT ["aici"]
          DOCKERFILE
      - name: Run Aici without network
        run: |
          mkdir -p .aici-docker
          docker run --rm --network none \
            -v "$PWD:/work:ro" \
            -v "$PWD/.aici-docker:/reports" \
            -w /work \
            aici-fixture:0.1.9 \
            run --config aici.yml --report-dir /reports
```

Do not pass provider secrets to this job.

The CI example builds from inline workflow text instead of `examples/docker/Dockerfile.fixture` on purpose. In untrusted pull requests, files from the PR are attacker-controlled. Build the image from trusted workflow text, a trusted tag, or a prebuilt internal image before mounting the PR checkout.

## Live Checks

Live provider checks cannot use `--network none` because they need to reach OpenAI, Anthropic, or your OpenAI-compatible endpoint.

For strict live checks, use all of these together:

- A dedicated trusted workflow or job.
- `allow-provider-secrets: true` only after reviewing the config and referenced files.
- `allowed-provider-endpoints` or `--allow-provider-endpoint`.
- Runner, container, firewall, or proxy egress policy that allows only the approved provider domains.

Docker Desktop can reliably give you `--network none`. It does not provide a simple one-line, per-container HTTPS domain allowlist for live provider calls. For that, use CI runner egress controls, a locked-down self-hosted runner, or an explicit egress proxy.

## Why Aici Does Not Claim This Itself

Aici runs as a normal CLI process. It can enforce the provider endpoints it calls, but it cannot control unrelated commands in the same CI job. A container or runner policy is the correct layer for whole-process egress enforcement.
