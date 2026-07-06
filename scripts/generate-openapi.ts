import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openApiSpec } from '../src/docs/swagger-data.js';

const root = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);
const outputPath = resolve(root, 'docs', 'openapi.json');

const main = async () => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(openApiSpec, null, 2)}\n`,
    'utf8',
  );
  console.log(`OpenAPI spec written to ${outputPath}`);
};

void main().catch((error) => {
  console.error('Failed to generate OpenAPI spec', error);
  process.exit(1);
});
