# Support

Node Devbox is maintained by the open-source community. Support is provided on
a best-effort basis; no response time or compatibility with every host setup is
guaranteed.

## Before asking for help

1. Read the [README](README.md), especially workspace storage, everyday
   commands, and security boundaries.
2. Try the latest published CLI and container image.
3. Search existing GitHub issues for the error or workflow.
4. Collect versions without including credentials:

   ```bash
   node --version
   npm --version
   docker version
   docker compose version
   ```

## Where to ask

- Use the GitHub question form for setup and usage questions.
- Use the bug form for reproducible Node Devbox defects.
- Use the feature form for a concrete workflow the project does not support.
- Use the documentation form for missing, incorrect, or unclear instructions.
- Follow [SECURITY.md](SECURITY.md) for suspected vulnerabilities. Never report
  a vulnerability or exposed credential in a public issue.

General Docker, Git, GitHub, Node.js, and VS Code questions are usually better
answered by those projects' documentation or support communities unless the
problem is caused specifically by Node Devbox.

## Useful diagnostic information

Include the Node Devbox version, host operating system and architecture, Node.js
version, Docker and Compose versions, workspace mode, exact command, expected
result, actual result, and a minimal reproduction. Use fenced code blocks for
logs and redact tokens, account details, private repository names, and sensitive
host paths.

## Supported releases

Bug and security fixes target the latest npm release and published container
image. Older releases may be discussed, but maintainers can ask reporters to
reproduce an issue on the current release before investigating it.
