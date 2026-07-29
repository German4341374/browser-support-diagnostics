import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const allowedPermissions = new Set(['activeTab', 'scripting', 'storage']);
const forbiddenManifestKeys = ['background', 'content_scripts', 'host_permissions'];
const failures = [];

for (const permission of manifest.permissions ?? []) {
  if (!allowedPermissions.has(permission)) {
    failures.push(`Unexpected permission: ${permission}`);
  }
}

for (const key of forbiddenManifestKeys) {
  if (Object.hasOwn(manifest, key)) {
    failures.push(`Manifest must not declare ${key}.`);
  }
}

const sourceFiles = await findJavaScriptFiles(path.join(root, 'src'));
const forbiddenSourcePatterns = [
  { pattern: /\bfetch\s*\(/u, label: 'fetch request' },
  { pattern: /\bXMLHttpRequest\b/u, label: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/u, label: 'WebSocket' },
  { pattern: /\bdocument\.cookie\b/u, label: 'cookie value access' },
];

for (const filename of sourceFiles) {
  const source = await readFile(filename, 'utf8');
  for (const check of forbiddenSourcePatterns) {
    if (check.pattern.test(source)) {
      failures.push(`${path.relative(root, filename)} contains ${check.label}.`);
    }
  }
}

const collectorSource = await readFile(
  path.join(root, 'src', 'content', 'diagnostics-content.js'),
  'utf8',
);

if (/querySelector(All)?\([^)]*(input|textarea|form)/iu.test(collectorSource)) {
  failures.push('The page collector contains a form content query.');
}

if (failures.length > 0) {
  throw new Error(`Privacy checks failed:\n${failures.join('\n')}`);
}

async function findJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return findJavaScriptFiles(absolutePath);
      }
      return entry.name.endsWith('.js') ? [absolutePath] : [];
    }),
  );

  return nested.flat();
}
