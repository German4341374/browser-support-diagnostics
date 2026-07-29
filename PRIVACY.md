# Privacy Model

Browser Support Diagnostics is designed around local processing and data
minimization.

## Collected only after a user gesture

Opening the popup grants temporary `activeTab` access. The extension collects
the page URL, title, environment properties, Navigation Timing data, Resource
Timing metadata, and JavaScript errors observed after activation.

## Never collected

- cookie values;
- localStorage or sessionStorage values;
- form contents or passwords;
- browsing history outside the active tab;
- response bodies;
- analytics or advertising identifiers.

Storage availability is tested with a unique empty marker that is immediately
removed. No existing key or value is enumerated or read.

## Data movement

No source code path performs an external network request. Reports remain in the
popup until the user copies or exports them. The only persisted setting is the
slow-resource threshold stored through `chrome.storage.local`.

Query parameter values are replaced when their names contain the segments
`token`, `key`, `password`, or `secret`. Page titles and URL paths are not
automatically redacted, so exported reports should still be reviewed before
sharing.
