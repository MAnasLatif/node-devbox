# Node Devbox

[![npm version](https://img.shields.io/npm/v/node-devbox.svg)](https://www.npmjs.com/package/node-devbox)
[![CI](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/ci.yml)
[![Container](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Create named, isolated Node.js development environments with one command:

```bash
npx node-devbox my-project
```

The command creates `my-project`, adds the complete Docker Compose and VS Code
Dev Container setup, and assigns an explicit project name and stable host ports.
No global npm installation, repository clone, or local image build is required.

Container image: `ghcr.io/manaslatif/node-devbox:latest`

## Quick start

Requirements:

- Node.js 20.10 or newer to run the CLI
- Docker Desktop or Docker Engine with Docker Compose v2

```bash
npx node-devbox my-project
cd my-project
docker compose up -d
docker compose exec devbox dev-account
docker compose exec devbox bash
```

`dev-account` opens GitHub's browser login, configures Git HTTPS credentials,
and asks for the commit name and email used only by this devbox.

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
- its own container and persistent `devbox_home` volume;
- its own GitHub CLI login, Git identity, SSH keys, and global npm packages;
- stable project-specific host ports to avoid the usual `3000 already in use`
  conflict;
- the selected host folder mounted at `/workspace`.

Run `dev-account` once inside each project and choose the account intended for
that project. Removing one setup does not remove another setup's account or
files.

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
| `.env` | Explicit project identity, hostname, timezone, and host ports |
| `docker-compose.yml` | Public GHCR image, project mount, persistent home, and ports |
| `.devcontainer/devcontainer.json` | VS Code Reopen in Container support |
| `.vscode/settings.json` | Stops host Git config and credentials from being copied |

The generated `.env` contains configuration only, not secrets, and can be
committed with the project.

Existing source files are left alone. The CLI refuses to replace any generated
file path unless `--force` is provided.

## CLI options

```text
Usage: node-devbox <folder-name> [options]

  --name <name>       Set the Docker Compose project name
  --port-3000 <port>  Set the host port mapped to container port 3000
  --port-5173 <port>  Set the host port mapped to container port 5173
  --port-8080 <port>  Set the host port mapped to container port 8080
  --timezone <zone>   Set the container timezone (default: UTC)
  --start             Start the devbox after creating it
  --force             Replace generated file paths
  -h, --help          Show help
  -v, --version       Show the installed version
```

Examples:

```bash
# Add Node Devbox to the current folder
npx node-devbox .

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
| Project path | Host project bind-mounted at `/workspace` |

This is a development image. It is not intended for production workloads or
for executing hostile code.

## VS Code

After generating a project:

1. Install the Dev Containers extension (`ms-vscode-remote.remote-containers`).
2. Open the generated folder in VS Code.
3. Run **Dev Containers: Reopen in Container** from the Command Palette.

VS Code opens `/workspace` as `developer`. The generated settings prevent Dev
Containers from copying the host Git configuration and credential helper.

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
docker compose down -v                     # Remove container and account state
```

Project source files stay on the host and are not deleted by
`docker compose down -v`.

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
TZ=UTC
DEVBOX_PORT_3000=24567
DEVBOX_PORT_5173=34567
DEVBOX_PORT_8080=44567
```

Set `DEVBOX_IMAGE` in `.env` to pin or replace the image:

```dotenv
DEVBOX_IMAGE=ghcr.io/manaslatif/node-devbox:latest
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

Manual setup uses the folder name for Compose isolation and the standard host
ports unless an `.env` file overrides them.

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