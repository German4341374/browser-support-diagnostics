import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const source = await readFile(path.join(root, 'assets', 'icon.svg'));
const outputDirectory = path.join(root, 'src', 'assets');
const sizes = [16, 32, 48, 128];

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  sizes.map((size) =>
    sharp(source)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDirectory, `icon${size}.png`)),
  ),
);
