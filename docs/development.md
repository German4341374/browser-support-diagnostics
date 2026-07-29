# Development Notes

## Local workflow

```bash
npm ci
npm run lint
npm test
npm run privacy
npm run build
```

Load the generated `dist` directory through `chrome://extensions` with Developer
mode enabled. Re-run `npm run build` and select Reload after source changes.

## Testing boundaries

Unit tests cover URL masking, report normalization, Markdown and JSON exports,
Chrome API error paths, and settings validation. The privacy check also rejects
unexpected manifest permissions and source-level network primitives.

Chrome API behavior and popup layout should additionally be inspected manually
because the unit test environment does not emulate a full browser extension
process.

## Release checklist

1. Run `npm ci` from the lockfile.
2. Run `npm audit --audit-level=high`.
3. Run `npm run check`.
4. Load `dist` as an unpacked extension.
5. Verify collection on a public HTTPS page.
6. Verify export files contain masked sensitive query parameters.
7. Tag the reviewed commit.
