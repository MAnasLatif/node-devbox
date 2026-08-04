# Node Devbox

[![Publish container image](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml/badge.svg)](https://github.com/MAnasLatif/node-devbox/actions/workflows/publish-image.yml)

A reusable Node.js development environment distributed as a multi-architecture
container image. Copy one Compose file into any project; no clone or local image
build is required.

Image: `ghcr.io/manaslatif/node-devbox:latest`

## Included

| Item | Details |
| --- | --- |
| Runtime | Node.js 24, npm, Corepack, pnpm/yarn support |
| Development | Git, GitHub CLI, Python 3, build-essential |
| Utilities | curl, wget, jq, ripgrep, zip/unzip, zsh, SSH client |
| User | Non-root `developer` with passwordless sudo |
| Architectures | Linux AMD64 and ARM64 |
| Project files | Current host folder mounted at `/workspace` |
| Persistent state | GitHub login, Git config, SSH keys, shell state, and global npm packages |

This is a development image. It is not intended to run production workloads.

## Quick start

Requirements: Docker Desktop or Docker Engine with Docker Compose v2.

From any new or existing project folder:

```bash
curl -fsSLO https://raw.githubusercontent.com/MAnasLatif/node-devbox/main/docker-compose.yml
docker compose up -d
docker compose exec devbox bash
```

The first command downloads only the Compose file. `docker compose up` pulls the
published image from GitHub Container Registry and mounts the current folder at
`/workspace`.

Compose uses the folder name as the project name. This gives each project its
own container and persistent home volume. For folders with the same name, set a
unique `COMPOSE_PROJECT_NAME` as shown under Configuration.

## GitHub account

Configure the GitHub identity used inside this devbox:

```bash
docker compose exec devbox dev-account
```

The helper opens GitHub's browser login, configures `gh` as Git's HTTPS
credential helper, and asks for the commit name and email. Credentials and Git
configuration remain in this project's Docker home volume.

To keep a dedicated container account separate when using VS Code Dev
Containers, add these settings to VS Code User Settings:

```jsonc
"dev.containers.copyGitConfig": false,
"dev.containers.gitCredentialHelperConfigLocation": "none"
```

Verify the active identity inside the container:

```bash
gh auth status
git config --global --get-regexp '^(user|credential)\.'
```

## VS Code

For a project containing only the downloaded Compose file:

1. Install the Dev Containers extension (`ms-vscode-remote.remote-containers`).
2. Run `docker compose up -d`.
3. Run **Dev Containers: Attach to Running Container...** from the Command Palette.
4. Select the container ending in `-devbox-1`, then open `/workspace`.

When working from a clone of this repository, use **Dev Containers: Reopen in
Container** instead; the included `.devcontainer/devcontainer.json` supplies the
same configuration.

## Everyday commands

```bash
docker compose up -d                 # Start or recreate the devbox
docker compose exec devbox bash      # Open a shell
docker compose exec devbox node -v   # Check Node.js
docker compose exec devbox gh status # Check GitHub CLI
docker compose logs -f devbox        # Follow container logs
docker compose stop                  # Stop and keep all state
docker compose down                  # Remove container, keep home volume
```

Development servers must listen on `0.0.0.0` inside the container to be
reachable from the host. For example: `npm run dev -- --host 0.0.0.0`.

## Configuration

Defaults work without an `.env` file. Add one beside `docker-compose.yml` to
override them:

```dotenv
COMPOSE_PROJECT_NAME=my-project-dev
TZ=Asia/Karachi
DEVBOX_PORT_3000=3100
DEVBOX_PORT_5173=5174
DEVBOX_PORT_8080=8081
DEVBOX_IMAGE=ghcr.io/manaslatif/node-devbox:latest
DEVBOX_HOSTNAME=my-project-devbox
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Current folder name | Isolates container and volume names |
| `TZ` | `UTC` | Container timezone |
| `DEVBOX_IMAGE` | `ghcr.io/manaslatif/node-devbox:latest` | Image or pinned release tag |
| `DEVBOX_HOSTNAME` | `devbox` | Container hostname |
| `DEVBOX_PORT_3000` | `3000` | Host port mapped to container port 3000 |
| `DEVBOX_PORT_5173` | `5173` | Host port mapped to container port 5173 |
| `DEVBOX_PORT_8080` | `8080` | Host port mapped to container port 8080 |

To add another port, extend the service's `ports` list in `docker-compose.yml`.

## Updates and cleanup

Pull the newest image without losing the persisted home directory:

```bash
docker compose pull
docker compose up -d
```

Delete the devbox and its login, Git configuration, SSH keys, and global
packages:

```bash
docker compose down -v
```

Project source files are bind-mounted from the host and are not deleted by this
command.

## Image publishing

The `Publish container image` GitHub Actions workflow builds AMD64 and ARM64
images and publishes them to GHCR:

- Pushes to `main` publish `main` and `latest`.
- tags such as `v1.2.0` publish `v1.2.0`, `1.2.0`, and `1.2`.
- Pull requests build the image without publishing it.
- Manual runs are available through the Actions tab.

The workflow uses the repository's `GITHUB_TOKEN`; no registry secret is
required. The GHCR package must be public for unauthenticated one-file setup.
