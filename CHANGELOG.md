# Changelog

All notable user-facing changes to Node Devbox are documented here.

The project follows [Semantic Versioning](https://semver.org/). Entries describe
released behavior rather than every internal commit.

## [Unreleased]

### Documentation

- Reframe the project documentation around multiple Git and GitHub accounts,
  isolated experiments, security boundaries, and open-source collaboration.
- Add structured issue forms, a pull request template, support guidance, and a
  project code of conduct.

## [1.1.1] - 2026-08-04

### Changed

- Configure global Git name and email from the authenticated GitHub account in
  `dev-account` without separate identity prompts.
- Use the account's GitHub noreply address when its public email is unavailable.

## [1.1.0] - 2026-08-04

### Added

- Add explicit Docker-volume and host-bind workspace modes.
- Prompt for workspace storage during interactive setup.
- Generate project-specific stable host ports and allow explicit overrides.

### Changed

- Keep generated setup files outside `/workspace` so a volume workspace starts
  empty and is ready for a repository clone.

## [1.0.3] - 2026-08-04

### Changed

- Keep host setup files out of the VS Code container workspace.
- Prevent Dev Containers from copying host Git config and credentials.

## [1.0.2] - 2026-08-04

### Added

- Detect the host system timezone and use `UTC` as a safe fallback.
- Add a CLI timezone override.

## [1.0.1] - 2026-08-04

### Changed

- Migrate the npm CLI and tests to strict TypeScript compiled as ES modules.

## [1.0.0] - 2026-08-04

### Added

- Publish the initial Node Devbox npm CLI.
- Provide a reusable Node.js development image and Docker Compose setup.
- Isolate the developer home, GitHub CLI state, Git identity, SSH keys, global
  npm packages, workspace, and common development ports per project.

[Unreleased]: https://github.com/MAnasLatif/node-devbox/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/MAnasLatif/node-devbox/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/MAnasLatif/node-devbox/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/MAnasLatif/node-devbox/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/MAnasLatif/node-devbox/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/MAnasLatif/node-devbox/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MAnasLatif/node-devbox/releases/tag/v1.0.0
