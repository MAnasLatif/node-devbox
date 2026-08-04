# Node Devbox

[![npm version](https://img.shields.io/npm/v/node-devbox.svg)](https://www.npmjs.com/package/node-devbox)
[![CI](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml)
[![Container](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Create named, isolated Node.js development environments with one command:

```bash
npx node-devbox
```

The interactive setup asks for a Devbox folder and whether to mount a host
folder. The generated Docker Compose and VS Code files stay outside the
container workspace, so a new `/workspace` is empty and ready for a repository
clone. No global npm installation, repository clone, or local image build is
required.

The CLI and its tests are written in strict TypeScript. npm runs the compiled
ES module from `dist/`, so users do not need TypeScript installed globally.

Container image: `ghcr.io/manaslatif/node-devbox:latest`

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

## Workspace storage

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
docker compose down -v                     # Remove container, account, and volume workspace
```

With `--workspace`, project source files stay on the host and are not deleted
by `docker compose down -v`. Without a host mount, the project lives in the
`devbox_workspace` volume, and `docker compose down -v` permanently deletes it.

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
DEVBOX_IMAGE=ghcr.io/manaslatif/node-devbox:latest
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

## Manual Compose setup

The npm CLI is optional. To download only the generic Compose file:

```bash
curl -fsSLO https://raw.githubusercontent.com/MAnasLatif/node-devbox/main/docker-compose.yml
docker compose up -d
```

Manual setup uses the folder name for Compose isolation, a named workspace
volume, and the standard host ports unless an `.env` file overrides them.

## Publishing

GitHub Actions builds AMD64 and ARM64 images from `main` and publishes `main`
and `latest` tags to GHCR. Version tags such as `v1.2.0` also publish immutable
container version tags.

GitHub releases publish matching package versions to npm using Trusted
Publishing and provenance. Maintainer instructions are in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Open source

Node Devbox is available under the [MIT License](LICENSE). Contributions are
welcome; read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).