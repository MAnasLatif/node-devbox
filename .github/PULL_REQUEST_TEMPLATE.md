## Summary

Describe the user-visible problem and the focused solution in this pull request.

## Changes

<!-- List the important implementation changes. -->

## Validation

List the commands you ran and any relevant manual scenarios.

```text
npm run check
docker compose config --quiet
```

## Compatibility and security

Describe any effect on CLI behavior, generated files, container images,
credentials, volumes, host mounts, ports, or supported platforms. Write `None`
when there is no effect.

## Checklist

- [ ] The change is focused and does not include unrelated refactoring.
- [ ] Tests cover behavior changes and pass locally.
- [ ] User-facing commands or generated files are documented.
- [ ] Existing workflows remain compatible, or the breaking change is explicit.
- [ ] No credentials, tokens, private paths, or account state are included.
- [ ] I have read and followed `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
