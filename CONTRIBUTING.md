# Contributing

Thank you for helping improve Browser Support Diagnostics.

## Development workflow

1. Create a focused branch from `main`.
2. Install the locked dependencies with `npm ci`.
3. Make one cohesive change and add or update tests.
4. Run `npm run check`.
5. Use a Conventional Commit such as `fix: mask compound token parameters`.
6. Open a pull request describing behavior, privacy impact, and verification.

## Privacy requirements

Changes must not introduce host permissions, external requests, analytics,
cookie value access, storage value collection, or form inspection. Any new
permission requires a documented threat-model review.

## Code style

Use ES Modules, small pure functions where practical, and DOM `textContent` for
untrusted page values. Keep page-world collection self-contained because Chrome
serializes the injected function.
