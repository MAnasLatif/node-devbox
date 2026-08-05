# Contributing

Contributions to Node Devbox are welcome. Changes should solve a concrete
development workflow, preserve account and workspace isolation, and remain
small enough to review confidently.

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Use the
public issue forms for bugs, questions, documentation, and feature requests.
Report suspected vulnerabilities only through the private process in
[SECURITY.md](SECURITY.md).

## Before starting

- Search open and closed issues and pull requests for related work.
- Open a feature request before investing in a broad behavior or architecture
	change.
- Keep fixes and documentation improvements focused; they can usually go
	directly to a pull request.
- Never include credentials, npm tokens, GitHub tokens, SSH private keys,
	generated account state, or private repository details.

## Development requirements

- Git
- Node.js 20.10 or newer
- npm, included with Node.js
- Docker Desktop or Docker Engine with Docker Compose v2

The CLI has no runtime npm dependencies. TypeScript and Node.js types are local
development dependencies.

## Local setup

Fork and clone the repository, then install the exact locked dependencies:

```bash
git clone https://github.com/YOUR-ACCOUNT/node-devbox.git
cd node-devbox
npm ci
npm run check
docker compose config --quiet
```

Add the upstream repository if you are working from a fork:

```bash
git remote add upstream https://github.com/MAnasLatif/node-devbox.git
git fetch upstream
```

You can also open the clone in VS Code and run **Dev Containers: Reopen in
Container**. The repository-specific Compose override mounts the local clone at
`/workspace`; its developer home remains isolated in a Docker volume.

## Project layout

| Path | Responsibility |
| --- | --- |
| `src/node-devbox.ts` | CLI process, interactive input, output, and exit behavior |
| `src/scaffold.ts` | Argument validation, project identity, ports, and generated files |
| `test/scaffold.test.ts` | Unit and filesystem integration tests |
| `Dockerfile` | Published multi-architecture development image |
| `docker-compose.yml` | Generic runtime configuration copied by the CLI |
| `scripts/dev-account.sh` | GitHub authentication and Git identity setup |
| `.github/workflows/` | CI and npm/container publishing |

Keep behavior in the narrowest owning module. Avoid adding dependencies when a
Node.js standard library API provides a clear, portable solution.

## Development commands

```bash
npm run build          # Clean and compile strict TypeScript
npm test               # Build and run all Node.js tests
npm run check          # Test and inspect the packed npm artifact
npm pack --dry-run     # Show files that would be published
docker compose config --quiet
```

Run a focused test after building:

```bash
npm run build
node --test --test-name-pattern="workspace" dist/test/scaffold.test.js
```

Exercise the compiled CLI without publishing it:

```bash
node ./dist/src/node-devbox.js /tmp/example-devbox --no-workspace-mount
docker compose \
	--env-file /tmp/example-devbox/.env \
	-f /tmp/example-devbox/docker-compose.yml \
	config --quiet
```

Use a new temporary target or `--force` when repeating that command. Do not use
a valuable source directory for destructive lifecycle tests.

## Making changes

### CLI and generated files

- Preserve existing option names and generated configuration unless a breaking
	change has been explicitly accepted.
- Validate user-controlled names, paths, ports, and timezone values before
	writing files or starting Docker.
- Keep non-interactive behavior deterministic; it must not wait for prompts.
- Refuse to overwrite user files unless the user explicitly passes `--force`.
- Add tests for parsing errors, filesystem effects, generated content, and
	lifecycle behavior affected by the change.
- Update the CLI reference and examples in [README.md](README.md).

The root `docker-compose.yml` is copied verbatim into every generated setup.
Treat changes to it as changes to both this repository and the public CLI
contract.

### Container image and account setup

- Keep the image usable on Linux AMD64 and ARM64.
- Preserve the non-root `developer` user and persistent home-directory model.
- Do not bake credentials or machine-specific state into image layers.
- Test shell scripts with Bash and retain `set -euo pipefail` unless a specific
	command requires carefully handled failure.
- Build the image locally when changing the Dockerfile or account script:

	```bash
	docker build -t node-devbox:local .
	docker run --rm node-devbox:local node --version
	docker run --rm node-devbox:local gh --version
	```

Interactive GitHub login does not belong in automated tests. Mock external
commands as the existing `dev-account` test does.

### Documentation and community files

- Use direct language and executable examples.
- Distinguish Docker-volume workspaces from host bind mounts.
- State destructive behavior next to destructive commands.
- Do not describe the container as a security sandbox or production runtime.
- Add an entry under `Unreleased` in [CHANGELOG.md](CHANGELOG.md) for notable
	user-facing changes.

## Code style

- Follow strict TypeScript and the existing formatting style.
- Use explicit, descriptive names and exported types for public contracts.
- Prefer small functions with one clear responsibility.
- Keep errors actionable and use `CliError` for expected user-facing failures.
- Avoid unrelated formatting, refactoring, dependency, and generated-output
	changes in the same pull request.
- Add comments only when they explain a non-obvious constraint or decision.

Repository text uses UTF-8, LF line endings, final newlines, and spaces as
defined in `.editorconfig` and `.gitattributes`.

## Pull requests

1. Create a branch from the current `main` branch.
2. Make one focused change and add or update tests.
3. Update documentation and the changelog when behavior changes.
4. Run `npm run check` and `docker compose config --quiet`.
5. Complete the pull request template, including compatibility and security
	 impact.
6. Address review feedback with additional commits; maintainers may squash when
	 merging.

Pull requests must pass CI on Node.js 20.10, 22, and 24. A maintainer review is
required. Opening a pull request does not guarantee that a change will be
merged; project scope, compatibility, maintenance cost, and security all inform
the decision.

## Releases

This section is for maintainers.

1. Confirm CI is green and `CHANGELOG.md` describes the release.
2. Update the version in `package.json` and `package-lock.json`.
3. Move `Unreleased` entries into a dated version section and update comparison
	 links.
4. Merge the release change and publish a matching GitHub release such as
	 `v1.2.0`.

The npm workflow verifies that the tag matches `package.json`, runs tests, and
publishes through npm Trusted Publishing with provenance. The container
workflow publishes AMD64 and ARM64 version tags from matching Git tags.

Configure the `node-devbox` trusted publisher on npmjs.com with:

- GitHub owner: `MAnasLatif`
- Repository: `node-devbox`
- Workflow filename: `publish-npm.yml`
- Environment: leave empty
- Allowed action: `npm publish`
