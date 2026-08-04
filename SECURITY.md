# Security Policy

## Supported versions

Security fixes are applied to the latest published npm package and container
image.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or exposed secret.
Use GitHub's private vulnerability reporting for this repository:

https://github.com/MAnasLatif/node-devbox/security/advisories/new

Include the affected version, reproduction steps, impact, and any suggested
mitigation. Please remove credentials and personal data from reports.

## Security model

Node Devbox separates each generated environment with its own Docker Compose
project and home volume. GitHub CLI credentials, Git configuration, SSH keys,
shell state, and global npm packages therefore remain project-scoped.

The selected project folder is intentionally bind-mounted into the container.
The image includes passwordless sudo for development convenience and is not a
production sandbox for hostile code.