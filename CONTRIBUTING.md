# Contributing

Contributions to Node Devbox are welcome.

## Development setup

Requirements:

- Node.js 20.10 or newer
- Docker with Docker Compose v2

Clone the repository and run the checks:

```bash
git clone https://github.com/MAnasLatif/node-devbox.git
cd node-devbox
npm install
npm test
npm pack --dry-run
docker compose config --quiet
```

To exercise the CLI without publishing it:

```bash
node ./bin/node-devbox.js /tmp/example-devbox
docker compose -f /tmp/example-devbox/docker-compose.yml config --quiet
```

## Pull requests

1. Create a focused branch.
2. Add or update tests for behavior changes.
3. Run `npm run check` and `docker compose config --quiet`.
4. Open a pull request describing the behavior and validation performed.

Do not include credentials, npm tokens, GitHub tokens, or generated account
state in commits.

## Releases

Maintainers update the version in `package.json` and `package-lock.json`, merge
that change, and publish a matching GitHub release such as `v1.1.0`. The npm
workflow verifies the tag and publishes through npm Trusted Publishing.

Configure the `node-devbox` trusted publisher on npmjs.com with:

- GitHub owner: `MAnasLatif`
- Repository: `node-devbox`
- Workflow filename: `publish-npm.yml`
- Environment: leave empty
- Allowed action: `npm publish`