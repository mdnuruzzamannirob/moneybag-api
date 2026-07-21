import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { openApiSpec } from '../docs/swagger-data.js';

type JsonSchema = Record<string, unknown>;
type OpenApiOperation = Record<string, unknown>;
type OpenApiPathItem = Record<string, OpenApiOperation>;

interface RequestBodyContent {
  schema?: JsonSchema;
  example?: unknown;
}
interface RequestBody {
  content?: Record<string, RequestBodyContent>;
}
interface ResponseItem {
  description?: string;
  content?: Record<string, RequestBodyContent>;
}
interface Parameter {
  in?: string;
  name?: string;
  description?: string;
  schema?: JsonSchema;
}

const root = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);
const outputPath = resolve(root, 'docs', 'postman-collection.json');
const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
const collectionVariables = [
  { key: 'baseUrl', value: 'http://localhost:5000' },
  { key: 'accessToken', value: '' },
  { key: 'refreshToken', value: '' },
];

const sampleUuid = '00000000-0000-0000-0000-000000000001';

const getExampleFromSchema = (schema?: JsonSchema): unknown => {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'string':
      if (schema.format === 'uuid') return sampleUuid;
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date')
        return new Date().toISOString().slice(0, 10);
      if (schema.format === 'binary') return '';
      return 'string';
    case 'number':
    case 'integer':
      return 1;
    case 'boolean':
      return true;
    case 'array':
      return schema.items
        ? [getExampleFromSchema(schema.items as JsonSchema)]
        : [];
    case 'object': {
      const output: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        (schema.properties ?? {}) as Record<string, JsonSchema>,
      )) {
        output[key] = getExampleFromSchema(value);
      }
      return output;
    }
    default:
      return undefined;
  }
};

const buildExampleBody = (operation: OpenApiOperation) => {
  const requestBody = operation?.requestBody as RequestBody | undefined;
  const json = requestBody?.content?.['application/json'];
  if (json?.example !== undefined) return json.example;
  return getExampleFromSchema(json?.schema);
};

const buildRequestBody = (operation: OpenApiOperation) => {
  const requestBody = operation?.requestBody as RequestBody | undefined;
  const json = requestBody?.content?.['application/json'];
  if (json?.schema) {
    const example = buildExampleBody(operation);
    return {
      mode: 'raw',
      raw: JSON.stringify(example ?? {}, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  const formData = requestBody?.content?.['multipart/form-data'];
  if (formData?.schema) {
    const schema = formData.schema;
    const formDataFields = Object.entries(
      (schema.properties ?? {}) as Record<string, JsonSchema>,
    )
      .filter((entry): entry is [string, JsonSchema] => {
        const value = entry[1];
        return value !== null && typeof value === 'object';
      })
      .map(([key, value]) => ({
        key,
        type: value.format === 'binary' ? 'file' : 'text',
        value:
          value.format === 'binary'
            ? ''
            : String(getExampleFromSchema(value) ?? ''),
      }));

    return formDataFields.length > 0
      ? {
          mode: 'formdata',
          formdata: formDataFields,
        }
      : undefined;
  }

  return undefined;
};

const buildResponseBody = (operation: OpenApiOperation) => {
  const responses =
    (operation?.responses as Record<string, ResponseItem> | undefined) ?? {};
  const responseItems: unknown[] = [];

  for (const code of Object.keys(responses)) {
    const response = responses[code];
    const json = response?.content?.['application/json'];
    const isSuccess = ['200', '201', '202', '204'].includes(code);
    const example =
      json?.example !== undefined
        ? json.example
        : isSuccess
          ? {
              success: true,
              message: response?.description ?? 'Success',
              data: json?.schema
                ? (getExampleFromSchema(json.schema) ?? null)
                : null,
            }
          : undefined;

    if (example !== undefined) {
      responseItems.push({
        name: `${code} ${response?.description ?? 'Response'}`,
        originalRequest: {},
        status: response?.description ?? 'Response',
        code: Number(code),
        header: [],
        body: JSON.stringify(example ?? {}, null, 2),
      });
    }
  }

  return responseItems.length ? responseItems : undefined;
};

const buildHeaders = (operation: OpenApiOperation) => {
  const requestBody = operation?.requestBody as RequestBody | undefined;
  const headers = [{ key: 'Accept', value: 'application/json' }];
  if (requestBody?.content?.['application/json']) {
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  return headers;
};

const buildQuery = (operation: OpenApiOperation) => {
  const parameters = (operation?.parameters as Parameter[] | undefined) ?? [];
  return parameters
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => ({
      key: parameter.name,
      value:
        parameter.schema?.example ??
        parameter.schema?.default ??
        getExampleFromSchema(parameter.schema) ??
        '',
      description:
        parameter.description ??
        (Array.isArray(parameter.schema?.enum) && parameter.schema?.enum?.length
          ? `Allowed values: ${(parameter.schema?.enum as unknown[]).join(
              ', ',
            )}`
          : ''),
    }));
};

const buildPath = (path: string, operation: OpenApiOperation) => {
  const parameters = (operation?.parameters as Parameter[] | undefined) ?? [];
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^\{(.+)\}$/);
      if (!match) return segment;

      const parameterName = match[1];
      const parameter = parameters.find(
        (item) => item.in === 'path' && item.name === parameterName,
      );
      return (
        parameter?.schema?.example ??
        getExampleFromSchema(parameter?.schema) ??
        sampleUuid
      );
    });

  return {
    raw: `{{baseUrl}}/api/${segments.join('/')}`,
    host: ['{{baseUrl}}'],
    path: ['api', ...segments],
    query: buildQuery(operation),
  };
};

const tokenCaptureScript = `const body = pm.response.json();
if (body?.data?.accessToken) {
  pm.collectionVariables.set('accessToken', body.data.accessToken);
}
if (body?.data?.refreshToken) {
  pm.collectionVariables.set('refreshToken', body.data.refreshToken);
}`;

const buildEventScripts = (path: string) => {
  if (!['/auth/register', '/auth/login', '/auth/refresh'].includes(path)) {
    return undefined;
  }

  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: tokenCaptureScript.split('\n'),
      },
    },
  ];
};

const isPublicOperation = (operation: OpenApiOperation) =>
  Array.isArray(operation.security) && operation.security.length === 0;

const buildRequest = (
  path: string,
  method: string,
  operation: OpenApiOperation,
) => ({
  method: method.toUpperCase(),
  header: buildHeaders(operation),
  url: buildPath(path, operation),
  body: buildRequestBody(operation),
  description: operation.description ?? operation.summary ?? '',
  auth: isPublicOperation(operation)
    ? undefined
    : {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
      },
});

const buildItem = ([path, methodsObject]: [string, OpenApiPathItem]) => {
  const operations = methods
    .filter((method) => methodsObject[method])
    .map((method) => {
      const operation = methodsObject[method];
      if (!operation) {
        throw new Error(
          `Missing operation metadata for ${method.toUpperCase()} ${path}`,
        );
      }

      return {
        name: operation.summary ?? `${method.toUpperCase()} ${path}`,
        request: buildRequest(path, method, operation),
        response: buildResponseBody(operation),
        event: buildEventScripts(path),
      };
    });

  return { name: path, item: operations };
};

const groupByTag = () => {
  const groups = new Map<string, Array<[string, OpenApiPathItem]>>();

  for (const entry of Object.entries(
    (openApiSpec.paths ?? {}) as Record<string, OpenApiPathItem>,
  )) {
    const [, methodsObject] = entry;
    const firstOperation = methods.find((method) => methodsObject[method]);
    const firstTaggedOperation = firstOperation
      ? methodsObject[firstOperation]
      : undefined;
    const tags = firstTaggedOperation?.tags as string[] | undefined;
    const tag = tags?.[0] ?? 'Ungrouped';

    const existing = groups.get(tag) ?? [];
    existing.push(entry);
    groups.set(tag, existing);
  }

  return [...groups.entries()].map(([name, items]) => ({
    name,
    item: items.map(buildItem),
  }));
};

const collection = {
  info: {
    name: 'Expense Tracker API',
    description: 'Auto-generated Postman collection from the OpenAPI source.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  item: groupByTag(),
  variable: collectionVariables,
};

const main = async () => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(collection, null, 2)}\n`,
    'utf8',
  );
  console.log(`Postman collection written to ${outputPath}`);
};

void main().catch((error) => {
  console.error('Failed to generate Postman collection', error);
  process.exit(1);
});
