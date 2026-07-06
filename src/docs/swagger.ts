import type { Express } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './swagger-data.js';

const openApiSnapshotPath = resolve(process.cwd(), 'docs', 'openapi.json');

const loadOpenApiSpec = () => {
  if (!existsSync(openApiSnapshotPath)) {
    return openApiSpec;
  }

  try {
    const file = readFileSync(openApiSnapshotPath, 'utf8');
    return JSON.parse(file) as typeof openApiSpec;
  } catch {
    return openApiSpec;
  }
};

const swaggerSpec = swaggerJsdoc({
  definition: loadOpenApiSpec() as never,
  apis: ['src/modules/**/*.ts'],
});

export const setupSwagger = (app: Express) => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true }),
  );
};

export { swaggerSpec };
