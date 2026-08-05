# Node Devbox

[![npm version](https://img.shields.io/npm/v/node-devbox.svg)](https://www.npmjs.com/package/node-devbox)
[![CI](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml)
[![Container](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Quick start](#quick-start) | [Use cases](#use-cases) | [CLI options](#cli-options) |
[Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md) | [Support](SUPPORT.md)

Create named, isolated Node.js development environments with one command:

```bash
npx node-devbox
```

Node Devbox lets you use personal, work, client, and open-source GitHub
accounts on the same laptop without sharing their Git credentials, Git config,
SSH keys, global npm packages, or shell state. Each Devbox is a Docker Compose
project with its own persistent developer home, workspace, hostname, and host
ports.

No global installation, local image build, or repository clone is required.
The generated Docker Compose and VS Code files stay outside the container
workspace, leaving `/workspace` ready for your source code.

Container image: `ghcr.io/manaslatif/node-devbox:latest`

## Why Node Devbox?

A normal host setup shares one `~/.gitconfig`, one GitHub CLI login, one SSH
directory, and one set of global tools across every repository. That becomes
risky when the same laptop is used for a company account, personal projects,
client work, and open-source contributions. A command run in the wrong terminal
can create a commit or pull request with the wrong identity.

Node Devbox gives every named environment its own `/home/developer` volume.
GitHub authentication and developer state stay with that environment, while
the project workspace can live in another Docker volume or map to a selected
folder on the host.

| Resource | Isolation and persistence |
| --- | --- |
| GitHub CLI login | Stored per Devbox in `/home/developer/.config/gh` |
| Git identity | Stored in the Devbox global Git config |
| SSH keys | Stored in the Devbox home volume |
| Global npm packages | Installed under the Devbox home volume |
| Shell and tool config | Stored in the Devbox home volume |
| Project files | Stored in an isolated volume or selected host folder |
| Containers and networks | Namespaced by the Docker Compose project name |
| Development ports | Deterministically derived per project and configurable |

VS Code is configured not to copy the host's Git config or credential helper
into the container.

## Use cases

Node Devbox is useful when you need to:

- keep personal and company GitHub accounts signed in at the same time;
- use a different Git identity for each client or organization;
- contribute to open source without changing the host's work credentials;
- keep SSH keys, npm globals, and shell configuration project-scoped;
- create a clean Linux environment for a repository or bug reproduction;
- test a dependency, CLI, migration, or proof of concept in a disposable
  workspace;
- onboard a contributor with the same baseline Node.js tools;
- run several Node.js applications without repeatedly resolving common port
  conflicts;
- keep project dependencies and build tools off the host machine;
- stop and resume long-lived environments without signing in again.

It is a good fit for day-to-day development, account separation, client work,
demos, workshops, repository evaluation, and temporary experiments.

It is **not** a production runtime, virtual machine, or hardened sandbox for
hostile code. The container has network access and passwordless `sudo`, and a
bind-mounted workspace can modify the selected host folder. Anyone with
privileged access to the Docker daemon can also access Docker volumes. Review
untrusted code before running it.

## How it works

The npm CLI creates configuration on the host; Docker Compose then creates the
isolated runtime and persistent storage:

```text
Host setup folder                 Docker Compose project
|-- .env                         |-- devbox container
|-- docker-compose.yml    ---->  |   |-- /home/developer  <--- devbox_home
|-- .devcontainer/               |   `-- /workspace       <--- volume or host folder
`-- .vscode/                     `-- project network and port mappings
```

The setup folder is not mounted at `/workspace`. This keeps environment
configuration separate from repository source and lets one Devbox point to an
existing source folder or start with an empty volume.

## Quick start

Requirements:

- Node.js 20.10 or newer to run the CLI
- Docker Desktop or Docker Engine with Docker Compose v2

```bash
npx node-devbox my-project --no-workspace-mount
cd my-project
docker compose up -d
docker compose exec devbox dev-account
docker compose exec devbox bash
```

`dev-account` opens GitHub's browser login and configures Git HTTPS credentials.
It automatically sets `git user.name` to the authenticated GitHub username and
uses the account's public email, or its GitHub noreply address when the email is
private. It does not prompt separately for the Git name or email. Inside the
shell, `/workspace` is initially empty:

```bash
git clone https://github.com/example/project.git .
```

Use `--start` to create and start it in one command:

```bash
npx node-devbox my-project --start
```

## Multiple projects and accounts

Create as many environments as needed:

```bash
npx node-devbox personal-api
npx node-devbox client-dashboard
npx node-devbox open-source-work
```

Each generated folder has:

- its own Docker Compose project name;
- its own container, persistent home volume, and workspace storage;
- its own GitHub CLI login, Git identity, SSH keys, and global npm packages;
- stable project-specific host ports to avoid the usual `3000 already in use`
  conflict;
- setup files that are not mounted at `/workspace`.

Run `dev-account` once inside each project and choose the account intended for
that project. Removing one setup does not remove another setup's account or
files.

For example, keep source on the host while maintaining separate work and
personal identities:

```bash
npx node-devbox ~/devboxes/work-api \
  --workspace ~/code/work-api \
  --name work-api \
  --start

npx node-devbox ~/devboxes/personal-oss \
  --workspace ~/code/personal-oss \
  --name personal-oss \
  --start
```

Sign in once from each setup:

```bash
cd ~/devboxes/work-api
docker compose exec devbox dev-account

cd ~/devboxes/personal-oss
docker compose exec devbox dev-account
```

Both accounts remain available because each Compose project owns a different
home volume. Before committing or publishing, verify the active identity:

```bash
docker compose exec devbox gh auth status
docker compose exec devbox git config --global --list
```

Run `dev-account` again when you intentionally want to replace the account in
one environment.

Git itself is provider-neutral. For GitLab, Bitbucket, self-hosted Git, or an
account that does not use GitHub CLI, configure the identity inside its Devbox:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub
```

Add the printed public key to that Git provider. The private key and Git config
remain in this Devbox's home volume. Registry configuration such as `~/.npmrc`
is isolated there as well.

## Workspace storage

Choose storage based on how the source should be accessed and removed:

| Mode | Command | Best for | What `docker compose down -v` deletes |
| --- | --- | --- | --- |
| Docker volume | `--no-workspace-mount` | Experiments, fresh clones, maximum separation | Workspace files and Devbox home |
| Host bind mount | `--workspace <path>` | Existing source, host editors, host backups | Devbox home only; host source remains |

When options are omitted in an interactive terminal, the CLI asks:

```text
Devbox setup folder:
Mount a host folder at /workspace? [y/N]
Host workspace folder: # asked only after yes
```

Answer **no** to use an isolated Docker volume. A newly created volume gives
the container an empty, writable `/workspace`. Answer **yes** to bind a host
folder, making that folder's existing contents available at `/workspace`.

For scripts and other non-interactive use, choose the mode explicitly:

```bash
node-devbox my-devbox --no-workspace-mount
node-devbox my-devbox --workspace ../my-app
```

The host workspace cannot contain the Devbox setup folder because that would
put the generated configuration back inside `/workspace`. A workspace inside
the setup folder, such as the interactive default `my-devbox/workspace`, is
safe because only that child folder is mounted.

## Practical workflows

### Open-source contribution environment

Use a dedicated Devbox so forks, commits, and pull requests use the intended
personal account:

```bash
npx node-devbox oss-contribution --no-workspace-mount --start
cd oss-contribution
docker compose exec devbox dev-account
docker compose exec devbox bash
```

Then, inside the container:

```bash
gh repo fork owner/project --clone
cd project
git switch -c fix/descriptive-branch
# Make the change and run the project's checks.
git push -u origin HEAD
gh pr create
```

The repository, fork credentials, commit identity, and pull-request account all
remain associated with this environment.

### Disposable experiment

Use a volume workspace when an experiment should leave no source files on the
host:

```bash
npx node-devbox dependency-spike --no-workspace-mount --start
cd dependency-spike
docker compose exec devbox bash
```

When finished, remove the container and both persistent volumes:

```bash
docker compose down -v
```

This permanently deletes the volume-backed workspace and its account state.
The generated setup folder remains and can be reviewed or removed separately.

### Existing project on the host

Keep source available to host tools while isolating the runtime and developer
account:

```bash
npx node-devbox my-app-devbox --workspace ../my-app --start
cd my-app-devbox
docker compose exec devbox dev-account
docker compose exec devbox bash
```

Changes under `/workspace` are changes to the selected host folder. Removing
Docker volumes does not remove those host files.

### Clean reproduction or onboarding

Create a volume-backed Devbox, clone the repository, and run only its documented
installation steps. This helps distinguish real repository requirements from
tools that happen to be installed on a developer's laptop. Share the commands
used, not account state or Docker volumes.

## Generated files

```text
my-project/
|-- .devcontainer/
|   `-- devcontainer.json
|-- .vscode/
|   `-- settings.json
|-- .env
`-- docker-compose.yml
```

| File | Purpose |
| --- | --- |
| `.env` | Explicit project identity, hostname, detected system timezone, and host ports |
| `docker-compose.yml` | Public GHCR image, project mount, persistent home, and ports |
| `.devcontainer/devcontainer.json` | VS Code Reopen in Container support |
| `.vscode/settings.json` | Stops host Git config and credentials from being copied |

The generated `.env` contains configuration only, not secrets. A bind-mode
workspace path can be machine-specific, so review it before committing the
setup folder.

Existing source files are left alone. The CLI refuses to replace any generated
file path unless `--force` is provided.

Credentials live in the project-scoped Docker home volume. They are not written
to `.env` or the generated Compose and VS Code files.

## CLI options

```text
Usage: node-devbox [folder-name] [options]

  --name <name>       Set the Docker Compose project name
  --port-3000 <port>  Set the host port mapped to container port 3000
  --port-5173 <port>  Set the host port mapped to container port 5173
  --port-8080 <port>  Set the host port mapped to container port 8080
  --timezone <zone>   Override the detected system timezone
  --workspace <path> Mount a host folder at /workspace
  --no-workspace-mount
                      Store /workspace in a Docker volume
  --start             Start the devbox after creating it
  --force             Replace generated file paths
  -h, --help          Show help
  -v, --version       Show the installed version
```

Examples:

```bash
# Prompt for the setup folder and workspace storage
npx node-devbox

# Use an empty persistent Docker volume
npx node-devbox my-devbox --no-workspace-mount

# Mount an existing application folder
npx node-devbox my-devbox --workspace ../my-app

# Choose an explicit Compose identity
npx node-devbox client-app --name acme-client-app

# Use conventional host ports instead of generated project-specific ports
npx node-devbox demo --port-3000 3000 --port-5173 5173 --port-8080 8080

# Set a timezone and start immediately
npx node-devbox backend --timezone Asia/Karachi --start
```

Project names are normalized for Docker Compose. Default host ports are
deterministically generated from that name, so restarting the same setup keeps
the same mappings. Hash collisions or conflicts with other applications are
still possible; the CLI does not reserve ports. Use the port options when a
generated port is unavailable.

## Included tools

| Item | Details |
| --- | --- |
| Runtime | Node.js 24, npm, Corepack, pnpm/yarn support |
| Development | Git, GitHub CLI, Python 3, build-essential |
| Utilities | curl, wget, jq, ripgrep, zip/unzip, zsh, SSH client |
| User | Non-root `developer` with passwordless sudo |
| Architectures | Linux AMD64 and ARM64 |
| Project path | Named volume or selected host folder mounted at `/workspace` |

This is a development image. It is not intended for production workloads or
for executing hostile code.

The included Node.js runtime is fixed by the published image. Set
`DEVBOX_IMAGE` to a compatible custom image when a project needs a different
runtime or toolchain.

## VS Code

After generating a project:

1. Install the Dev Containers extension (`ms-vscode-remote.remote-containers`).
2. Open the generated folder in VS Code.
3. Run **Dev Containers: Reopen in Container** from the Command Palette.

VS Code opens `/workspace` as `developer`. Generated setup files remain in the
host setup folder and are not present in the container workspace. The generated
settings prevent Dev Containers from copying the host Git configuration and
credential helper.

## Everyday commands

Run these from the generated project folder:

```bash
docker compose up -d                       # Start or recreate
docker compose exec devbox bash            # Open a shell
docker compose exec devbox node -v         # Check Node.js
docker compose exec devbox gh auth status  # Check the GitHub account
docker compose logs -f devbox              # Follow logs
docker compose stop                        # Stop and keep state
docker compose down                        # Remove container, keep account state
docker compose down -v                     # Remove container and all Devbox volumes
```

With `--workspace`, project source files stay on the host and are not deleted
by `docker compose down -v`. Without a host mount, that command permanently
deletes the volume-backed project. In both modes it deletes the home volume,
including GitHub authentication and developer configuration.

Development servers must listen on `0.0.0.0` inside the container. The CLI
prints the generated host mappings after setup. View them again with:

```bash
docker compose port devbox 3000
docker compose port devbox 5173
docker compose port devbox 8080
```

## Configuration

Edit the generated `.env` to change a setup:

```dotenv
COMPOSE_PROJECT_NAME=my-project
DEVBOX_HOSTNAME=my-project-devbox
TZ=Asia/Karachi
DEVBOX_WORKSPACE_SOURCE="devbox_workspace"
DEVBOX_PORT_3000=24567
DEVBOX_PORT_5173=34567
DEVBOX_PORT_8080=44567
```

By default, the CLI reads the host timezone from Node.js `Intl` and writes it to
`TZ`. For example, a system set to `Asia/Karachi` generates
`TZ=Asia/Karachi`. Use `--timezone` to override it. If the host timezone cannot
be detected, the safe fallback is `UTC`.

Set `DEVBOX_IMAGE` in `.env` to pin or replace the image:

```dotenv
DEVBOX_IMAGE=ghcr.io/manaslatif/node-devbox:1.1.1
```

To switch an existing setup to a host workspace, use an absolute path:

```dotenv
DEVBOX_WORKSPACE_SOURCE="/Users/example/projects/my-app"
```

To add another port, extend the service's `ports` list in
`docker-compose.yml`.

## Updates

Pull a newer image without losing the project-scoped account state:

```bash
docker compose pull
docker compose up -d
```

Run the current CLI with `--force` to refresh its generated files. Review and
commit local configuration first because this replaces `.env`,
`docker-compose.yml`, `.devcontainer/devcontainer.json`, and
`.vscode/settings.json`.

Pin `DEVBOX_IMAGE` instead of using `latest` when reproducibility is more
important than automatically receiving image updates.

## Manual Compose setup

The npm CLI is optional. To download only the generic Compose file:

```bash
curl -fsSLO https://raw.githubusercontent.com/MAnasLatif/node-devbox/main/docker-compose.yml
docker compose up -d
```

Manual setup uses the folder name for Compose isolation, a named workspace
volume, and the standard host ports unless an `.env` file overrides them.

## Security and data boundaries

- Credentials are stored in the project-scoped Docker home volume, not in the
  generated `.env` file.
- Host Git credentials are not copied into VS Code Dev Containers.
- Bind mode grants the container read/write access to the selected host folder.
- The image runs as `developer`, but that user has passwordless `sudo` inside
  the container.
- Docker isolation does not protect against someone who controls the host or
  Docker daemon.
- `docker compose down -v` removes account state and any volume workspace, but
  cannot erase credentials copied elsewhere.
- The three built-in development ports are host resources and can still
  conflict with unrelated applications.

Report suspected vulnerabilities privately as described in
[SECURITY.md](SECURITY.md). Never include live credentials or personal data in
an issue, test fixture, log, or pull request.

## Publishing

GitHub Actions builds AMD64 and ARM64 images from `main` and publishes `main`
and `latest` tags to GHCR. Version tags such as `v1.2.0` also publish immutable
container version tags.

GitHub releases publish matching package versions to npm using Trusted
Publishing and provenance. Maintainer instructions are in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Open-source collaboration

Node Devbox is maintained in the open under the [MIT License](LICENSE).
Contributions of different sizes are useful, including:

- reproducible bug reports and compatibility findings;
- documentation corrections and clearer examples;
- tests for CLI parsing, generated files, and account setup;
- focused improvements to the CLI or container image;
- accessibility and onboarding improvements;
- proposals backed by a concrete development workflow.

Before opening an issue, search existing issues and reproduce the behavior with
the latest release. A useful report includes the Node.js version, operating
system and architecture, Docker and Compose versions, exact command, expected
behavior, actual output, and a minimal reproduction. Redact account names,
tokens, private repository URLs, and local paths where necessary.

For a pull request:

1. Fork the repository and create a focused branch.
2. Add or update tests for behavior changes.
3. Update user documentation when commands or generated files change.
4. Run `npm run check` and `docker compose config --quiet`.
5. Explain the problem, solution, tradeoffs, and validation in the PR.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development and release process.
Keep discussions respectful, technical, and welcoming to contributors with
different levels of experience. Security reports must use the private channel
documented in [SECURITY.md](SECURITY.md), not a public issue.

Project participation follows the [Code of Conduct](CODE_OF_CONDUCT.md). Usage
questions and diagnostic guidance are covered by [SUPPORT.md](SUPPORT.md), and
released user-facing changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Development

The CLI and tests use strict TypeScript and Node.js's built-in test runner.
Continuous integration runs on Node.js 20.10, 22, and 24, validates the npm
package, and checks the Docker Compose configuration.

```bash
npm ci
npm run build
npm test
npm pack --dry-run
docker compose config --quiet
```
