import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputDirectory = path.join(root, 'dist');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(path.join(root, 'src'), path.join(outputDirectory, 'src'), {
  recursive: true,
});
await cp(path.join(root, 'manifest.json'), path.join(outputDirectory, 'manifest.json'));
await cp(path.join(root, 'LICENSE'), path.join(outputDirectory, 'LICENSE'));

const manifest = JSON.parse(
  await readFile(path.join(outputDirectory, 'manifest.json'), 'utf8'),
);

if (manifest.manifest_version !== 3) {
  throw new Error('Build requires a Manifest V3 extension.');
}

await writeFile(
  path.join(outputDirectory, 'BUILD.txt'),
  [
    'Browser Support Diagnostics',
    `Version: ${manifest.version}`,
    'Built from committed source files.',
    '',
  ].join('\n'),
);
