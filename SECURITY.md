# Security Policy

## Supported versions

Security fixes target the latest published npm package and container image.
Reporters may be asked to reproduce a problem with the latest release.

| Version | Supported |
| --- | --- |
| Latest npm release and image | Yes |
| Older releases and image tags | No |

## Reporting a vulnerability

Do not open a public issue, discussion, or pull request for a suspected
vulnerability or exposed secret. Use GitHub's private vulnerability reporting:

https://github.com/MAnasLatif/node-devbox/security/advisories/new

Include the affected package version or image tag, host platform, workspace
mode, reproduction steps, impact, and any suggested mitigation. Use test
credentials and remove personal data, private repository names, tokens, and
unrelated logs.

The maintainer will acknowledge and assess reports on a best-effort basis.
Please allow time to investigate before public disclosure. If a report is
accepted, maintainers will coordinate a fix and release details with the
reporter where practical.

## Security model

Each generated environment uses a separate Docker Compose project and
persistent home volume. GitHub CLI credentials, global Git configuration, SSH
keys, shell state, registry configuration, and global npm packages are scoped
to that Devbox rather than copied from the host by default.

Workspace access depends on the selected mode:

- A Docker-volume workspace is separate from ordinary host source folders but
	remains accessible to the host's Docker daemon and privileged Docker users.
- A bind-mounted workspace intentionally grants the container read/write access
	to the selected host folder.

The generated `.env`, Compose file, and VS Code settings contain configuration,
not account credentials. `dev-account` stores authentication in the Devbox home
volume and configures Git HTTPS credentials through GitHub CLI.

## Trust boundaries and limitations

Node Devbox is a convenient development environment, not a hardened security
sandbox:

- the `developer` user has passwordless `sudo` inside the container;
- the container has network access and can reach services allowed by Docker and
	the host network;
- published ports expose listening development services to interfaces selected
	by Docker;
- container processes can read and modify mounted workspace content;
- anyone controlling the host or Docker daemon can inspect containers, volumes,
	environment variables, and network traffic;
- dependencies, cloned repositories, install scripts, and development servers
	execute with the access granted to the container.

Do not use Node Devbox to execute hostile code, isolate secrets from the Docker
administrator, or run production workloads. Review untrusted dependencies and
source before running them.

## Credential and data hygiene

- Use a dedicated Devbox for each trust boundary or developer identity.
- Verify `gh auth status` and Git configuration before pushing or publishing.
- Never commit `.env` files containing later manual secret additions, private
	keys, tokens, or copied Docker volume data.
- Pin `DEVBOX_IMAGE` to a version tag when reproducibility matters.
- Use `docker compose down -v` to remove the home volume and any volume-backed
	workspace when retiring an environment.
- Remember that deleting volumes does not revoke tokens copied elsewhere;
	revoke exposed credentials at their provider.

General support questions belong in the public issue forms described in
[SUPPORT.md](SUPPORT.md).
