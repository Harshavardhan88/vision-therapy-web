import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'dist-capacitor');
const indexPath = join(outDir, 'index.html');

mkdirSync(outDir, { recursive: true });
writeFileSync(
  indexPath,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vision Therapy</title>
  </head>
  <body>
    <h1>Vision Therapy Android Shell</h1>
    <p>This placeholder page exists for Capacitor sync.</p>
  </body>
</html>
`,
  'utf8'
);

console.log('Prepared dist-capacitor/index.html');
