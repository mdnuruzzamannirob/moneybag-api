type SchemaObject = Record<string, unknown>;
type ResponseObject = Record<string, unknown>;
type OpenApiDocument = Record<string, unknown>;
type OpenApiParameter = Record<string, unknown>;
type OpenApiOperation = Record<string, unknown>;

const sampleUuid = '00000000-0000-0000-0000-000000000001';

const getExampleFromSchema = (schema?: SchemaObject): unknown => {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return schema.enum[0];

  switch (schema.type) {
    case 'string':
      if (schema.format === 'uuid') return sampleUuid;
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date')
        return new Date().toISOString().slice(0, 10);
      return 'string';
    case 'number':
    case 'integer':
      return 1;
    case 'boolean':
      return true;
    case 'array':
      return [getExampleFromSchema(schema.items as SchemaObject)];
    case 'object': {
      const output: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(schema.properties ?? {})) {
        output[key] = getExampleFromSchema(value as SchemaObject);
      }
      return output;
    }
    default:
      return undefined;
  }
};

const enrichSchema = (schema?: SchemaObject): void => {
  if (!schema || typeof schema !== 'object') return;

  if (schema.example === undefined) {
    const example = getExampleFromSchema(schema);
    if (example !== undefined) {
      schema.example = example;
    }
  }

  if (schema.type === 'object' && schema.properties) {
    for (const value of Object.values(
      schema.properties as Record<string, SchemaObject>,
    )) {
      enrichSchema(value);
    }
  }

  if (
    schema.type === 'array' &&
    schema.items &&
    typeof schema.items === 'object'
  ) {
    enrichSchema(schema.items as SchemaObject);
  }
};

const enrichParameter = (parameter?: OpenApiParameter): void => {
  if (!parameter?.schema || typeof parameter.schema !== 'object') return;

  enrichSchema(parameter.schema as SchemaObject);

  if (Array.isArray((parameter.schema as SchemaObject).enum)) {
    const values = (parameter.schema as SchemaObject).enum as Array<
      string | number
    >;
    const allowedValues = `Allowed values: ${values.join(', ')}`;
    parameter.description = parameter.description
      ? `${parameter.description} ${allowedValues}`
      : allowedValues;
  }
};

const enrichOperation = (operation?: OpenApiOperation): void => {
  if (!operation) return;

  for (const parameter of (operation.parameters ?? []) as OpenApiParameter[]) {
    enrichParameter(parameter);
  }

  const requestBodies = (
    operation.requestBody as
      { content?: Record<string, { schema?: SchemaObject }> } | undefined
  )?.content;
  if (requestBodies) {
    for (const body of Object.values(
      requestBodies as Record<string, { schema?: SchemaObject } | undefined>,
    )) {
      if (body?.schema) enrichSchema(body.schema);
    }
  }
};

const unauthorizedResponse: ResponseObject = {
  description: 'Unauthorized',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: {
            type: 'string',
            example: 'Authentication token is required',
          },
        },
      },
    },
  },
};

const okResponse = <T extends SchemaObject>(
  description: string,
  schema?: T,
  example?: unknown,
) => ({
  description,
  content: schema
    ? {
        'application/json': {
          schema,
          example,
        },
      }
    : undefined,
});

const apiErrorResponse = (_status: number, message: string) => ({
  description: message,
  content: {
    'application/json': {
      example: {
        success: false,
        message,
      },
    },
  },
});

const uuidPathParameter = (name = 'id') => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
});

const jsonRequestBody = (
  required: string[],
  properties: Record<string, SchemaObject>,
) => ({
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required,
        properties,
      },
    },
  },
});

const fileRequestBody = (fieldName: string) => ({
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: [fieldName],
        properties: { [fieldName]: { type: 'string', format: 'binary' } },
      },
    },
  },
});

const openApiSpec: OpenApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker API',
    version: '1.0.0',
    description: 'REST API for personal finance management.',
    contact: {
      name: 'Md. Nuruzzaman',
      url: 'https://www.linkedin.com/in/mdnuruzzamannirob4/',
      email: 'dev.mdnuruzzaman@gmail.com',
    },
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Categories' },
    { name: 'Transactions' },
    { name: 'Budgets' },
    { name: 'Savings Goals' },
    { name: 'Reports' },
    { name: 'Dashboard' },
    { name: 'Family' },
    { name: 'Notifications' },
    { name: 'Billing' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
          meta: { type: 'object', additionalProperties: true },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          currency: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          icon: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          note: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string' } },
          receiptUrl: { type: 'string', nullable: true },
          isRecurring: { type: 'boolean' },
          recurringRule: {
            type: 'string',
            enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
            nullable: true,
          },
          categoryId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Budget: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          limit: { type: 'number' },
          alertThreshold: { type: 'integer' },
          month: { type: 'integer' },
          year: { type: 'integer' },
          categoryId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      SavingsGoal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          targetAmount: { type: 'number' },
          currentAmount: { type: 'number' },
          deadline: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' },
          progressPercent: { type: 'number' },
        },
      },
      MonthlyReport: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number' },
          totalExpense: { type: 'number' },
          netSavings: { type: 'number' },
        },
      },
    },
    responses: {
      UnauthorizedError: unauthorizedResponse,
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Md. Nuruzzaman' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'dev.mdnuruzzaman@gmail.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'Password123!',
                  },
                  currency: { type: 'string', example: 'BDT' },
                },
              },
            },
          },
        },
        responses: {
          '201': okResponse(
            'Registered successfully',
            { type: 'object' },
            {
              message: 'Registered successfully',
              data: {
                user: {
                  id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                  name: 'Md. Nuruzzaman',
                  email: 'dev.mdnuruzzaman@gmail.com',
                  role: 'USER',
                  currency: 'BDT',
                },
                accessToken: 'eyJhbGciOi...',
                refreshToken: 'eyJhbGciOi...',
              },
            },
          ),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'dev.mdnuruzzaman@gmail.com',
                  },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': okResponse(
            'Logged in successfully',
            { type: 'object' },
            {
              message: 'Logged in successfully',
              data: {
                user: {
                  id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                  name: 'Md. Nuruzzaman',
                  email: 'dev.mdnuruzzaman@gmail.com',
                  role: 'USER',
                  currency: 'BDT',
                },
                accessToken: 'eyJhbGciOi...',
                refreshToken: 'eyJhbGciOi...',
              },
            },
          ),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Rotate refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOi...' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Token refreshed') },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Login or register with Google',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: { type: 'string', example: 'google-id-token' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Google authentication successful') },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Revoke refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOi...' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Logged out successfully') },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Start password reset flow',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'dev.mdnuruzzaman@gmail.com',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Reset mail sent if account exists') },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Reset password using token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', example: '8c5d7f1c...' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'Password123!',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Password reset successfully') },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get authenticated auth session profile',
        responses: { '200': okResponse('Authenticated user fetched') },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current profile',
        responses: {
          '200': okResponse(
            'Profile fetched',
            { type: 'object' },
            {
              message: 'Profile fetched',
              data: {
                id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                name: 'Md. Nuruzzaman',
                email: 'dev.mdnuruzzaman@gmail.com',
                role: 'USER',
                currency: 'BDT',
                isActive: true,
              },
            },
          ),
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Md. Nuruzzaman' },
                  currency: { type: 'string', example: 'USD' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Profile updated') },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete current account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Account deleted') },
      },
    },
    '/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'Password123!' },
                  newPassword: {
                    type: 'string',
                    minLength: 8,
                    example: 'Password123!',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Password changed') },
      },
    },
    '/users/me/export': {
      get: {
        tags: ['Users'],
        summary: 'Export current user data',
        parameters: [
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['json', 'csv'], default: 'json' },
          },
        ],
        responses: { '200': okResponse('User data exported') },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              description: 'Allowed values: INCOME, EXPENSE',
            },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          '200': okResponse(
            'Categories fetched',
            { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            [
              {
                id: '...',
                name: 'Food',
                type: 'EXPENSE',
                icon: 'utensils',
                color: '#f97316',
              },
            ],
          ),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type'],
                properties: {
                  name: { type: 'string', example: 'Groceries' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  icon: { type: 'string', example: 'shopping-bag' },
                  color: { type: 'string', example: '#22c55e' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Category created') },
      },
    },
    '/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Update category',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Groceries' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  icon: { type: 'string', example: 'shopping-bag' },
                  color: { type: 'string', example: '#22c55e' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Category updated') },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Category deleted') },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['date', 'amount', 'createdAt'],
              default: 'date',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          '200': okResponse(
            'Transactions fetched',
            {
              type: 'array',
              items: { $ref: '#/components/schemas/Transaction' },
            },
            [
              {
                id: '...',
                amount: 1200,
                type: 'EXPENSE',
                note: 'Groceries',
                date: '2026-07-04T10:00:00.000Z',
                tags: ['food', 'monthly'],
                categoryId: '...',
                userId: '...',
              },
            ],
          ),
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'type', 'categoryId', 'date'],
                properties: {
                  amount: { type: 'number', example: 1250 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  note: { type: 'string', example: 'Salary for July' },
                  date: { type: 'string', format: 'date-time' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['salary', 'monthly'],
                  },
                  receiptUrl: {
                    type: 'string',
                    example: 'https://res.cloudinary.com/.../receipt.png',
                  },
                  isRecurring: { type: 'boolean', example: false },
                  recurringRule: {
                    type: 'string',
                    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
                  },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Transaction created') },
      },
    },
    '/transactions/import': {
      post: {
        tags: ['Transactions'],
        summary: 'Import transactions from CSV',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { '201': okResponse('Transactions imported') },
      },
    },
    '/transactions/{id}/receipt': {
      post: {
        tags: ['Transactions'],
        summary: 'Attach receipt image to transaction',
        parameters: [uuidPathParameter()],
        requestBody: fileRequestBody('receipt'),
        responses: { '200': okResponse('Receipt attached') },
      },
    },
    '/transactions/{id}': {
      patch: {
        tags: ['Transactions'],
        summary: 'Update transaction',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 1250 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  note: { type: 'string', example: 'Salary for July' },
                  date: { type: 'string', format: 'date-time' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['salary', 'monthly'],
                  },
                  receiptUrl: {
                    type: 'string',
                    example: 'https://res.cloudinary.com/.../receipt.png',
                  },
                  isRecurring: { type: 'boolean', example: false },
                  recurringRule: {
                    type: 'string',
                    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Transaction updated') },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Delete transaction',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Transaction deleted') },
      },
    },
    '/budgets': {
      get: {
        tags: ['Budgets'],
        summary: 'List budgets',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: { '200': okResponse('Budgets fetched') },
      },
      post: {
        tags: ['Budgets'],
        summary: 'Create budget',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['limit', 'month', 'year', 'categoryId'],
                properties: {
                  limit: { type: 'number', example: 10000 },
                  alertThreshold: { type: 'integer', example: 80 },
                  month: { type: 'integer', example: 7 },
                  year: { type: 'integer', example: 2026 },
                  categoryId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Budget created') },
      },
    },
    '/budgets/alerts': {
      get: {
        tags: ['Budgets'],
        summary: 'Budget alerts',
        responses: { '200': okResponse('Budget alerts fetched') },
      },
    },
    '/budgets/{id}': {
      patch: {
        tags: ['Budgets'],
        summary: 'Update budget',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', example: 10000 },
                  alertThreshold: { type: 'integer', example: 80 },
                  month: { type: 'integer', example: 7 },
                  year: { type: 'integer', example: 2026 },
                  categoryId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Budget updated') },
      },
      delete: {
        tags: ['Budgets'],
        summary: 'Delete budget',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Budget deleted') },
      },
    },
    '/savings-goals': {
      get: {
        tags: ['Savings Goals'],
        summary: 'List savings goals',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: { '200': okResponse('Savings goals fetched') },
      },
      post: {
        tags: ['Savings Goals'],
        summary: 'Create savings goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'targetAmount', 'deadline'],
                properties: {
                  title: { type: 'string', example: 'New Laptop' },
                  targetAmount: { type: 'number', example: 120000 },
                  deadline: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Savings goal created') },
      },
    },
    '/savings-goals/{id}/contribute': {
      patch: {
        tags: ['Savings Goals'],
        summary: 'Add contribution',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: { amount: { type: 'number', example: 5000 } },
              },
            },
          },
        },
        responses: { '200': okResponse('Contribution added') },
      },
    },
    '/savings-goals/{id}': {
      delete: {
        tags: ['Savings Goals'],
        summary: 'Delete savings goal',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Savings goal deleted') },
      },
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard summary',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': okResponse('Dashboard fetched') },
      },
    },
    '/reports/monthly': {
      get: {
        tags: ['Reports'],
        summary: 'Monthly report',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 7 },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: {
          '200': okResponse(
            'Monthly report fetched',
            { $ref: '#/components/schemas/MonthlyReport' } as SchemaObject,
            {
              message: 'Monthly report fetched',
              data: {
                totalIncome: 50000,
                totalExpense: 24000,
                netSavings: 26000,
              },
            },
          ),
        },
      },
    },
    '/reports/yearly': {
      get: {
        tags: ['Reports'],
        summary: 'Yearly report',
        parameters: [
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: { '200': okResponse('Yearly report fetched') },
      },
    },
    '/reports/category-breakdown': {
      get: {
        tags: ['Reports'],
        summary: 'Category breakdown',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 7 },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: { '200': okResponse('Category breakdown fetched') },
      },
    },
    '/reports/trend': {
      get: {
        tags: ['Reports'],
        summary: 'Income vs expense trend',
        parameters: [
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: { '200': okResponse('Trend fetched') },
      },
    },
    '/reports/export': {
      get: {
        tags: ['Reports'],
        summary: 'Export report',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['pdf', 'csv'] },
          },
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: { '200': okResponse('Report exported') },
      },
    },
    '/family/groups': {
      get: {
        tags: ['Family'],
        summary: 'List family groups',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': okResponse('Family groups fetched') },
      },
      post: {
        tags: ['Family'],
        summary: 'Create family group',
        requestBody: jsonRequestBody(['name'], {
          name: { type: 'string', example: 'Home' },
        }),
        responses: { '201': okResponse('Family group created') },
      },
    },
    '/family/groups/{id}/invite': {
      post: {
        tags: ['Family'],
        summary: 'Invite member to family group',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody(['email'], {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['MEMBER', 'ADMIN'], example: 'MEMBER' },
        }),
        responses: { '201': okResponse('Invitation sent') },
      },
    },
    '/family/invitations/{token}/accept': {
      post: {
        tags: ['Family'],
        summary: 'Accept family invitation',
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'invitation-token' },
          },
        ],
        responses: { '200': okResponse('Invitation accepted') },
      },
    },
    '/family/groups/{id}/members/{userId}': {
      delete: {
        tags: ['Family'],
        summary: 'Remove member from family group',
        parameters: [uuidPathParameter(), uuidPathParameter('userId')],
        responses: { '200': okResponse('Member removed') },
      },
    },
    '/family/groups/{id}/transactions': {
      get: {
        tags: ['Family'],
        summary: 'List family group transactions',
        parameters: [
          uuidPathParameter(),
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': okResponse('Family transactions fetched') },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        parameters: [
          { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': okResponse('Notifications fetched') },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        responses: { '200': okResponse('Unread count fetched') },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        responses: { '200': okResponse('Notifications marked as read') },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Notification marked as read') },
      },
    },
    '/billing/webhook': {
      post: {
        tags: ['Billing'],
        security: [],
        summary: 'Stripe billing webhook',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': okResponse('Webhook processed') },
      },
    },
    '/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'List billing plans',
        responses: { '200': okResponse('Billing plans fetched') },
      },
    },
    '/billing/subscription': {
      get: {
        tags: ['Billing'],
        summary: 'Get current subscription',
        responses: { '200': okResponse('Subscription fetched') },
      },
    },
    '/billing/checkout': {
      post: {
        tags: ['Billing'],
        summary: 'Create Stripe checkout session',
        requestBody: jsonRequestBody(['planId'], {
          planId: { type: 'string', format: 'uuid' },
          successUrl: { type: 'string', example: 'http://localhost:3000/billing/success' },
          cancelUrl: { type: 'string', example: 'http://localhost:3000/billing/cancel' },
        }),
        responses: { '200': okResponse('Checkout session created') },
      },
    },
    '/billing/portal': {
      post: {
        tags: ['Billing'],
        summary: 'Create Stripe customer portal session',
        responses: { '200': okResponse('Portal session created') },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'role',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
            },
          },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: { '200': okResponse('Users fetched') },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin user detail',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('User detail fetched') },
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or deactivate user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean', example: true } },
              },
            },
          },
        },
        responses: { '200': okResponse('User status updated') },
      },
    },
    '/admin/users/{id}/impersonate': {
      post: {
        tags: ['Admin'],
        summary: 'Create impersonation token for user',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Impersonation token created') },
      },
    },
    '/admin/users/{id}/plan': {
      patch: {
        tags: ['Admin'],
        summary: 'Assign plan to user',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody(['planId'], {
          planId: { type: 'string', format: 'uuid' },
        }),
        responses: { '200': okResponse('User plan assigned') },
      },
    },
    '/admin/subscriptions': {
      get: {
        tags: ['Admin'],
        summary: 'List subscriptions',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': okResponse('Subscriptions fetched') },
      },
    },
    '/admin/subscriptions/{id}/refund': {
      post: {
        tags: ['Admin'],
        summary: 'Refund subscription payment',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody([], {
          amount: { type: 'number', example: 10 },
          reason: { type: 'string', example: 'requested_by_customer' },
        }),
        responses: { '200': okResponse('Subscription refunded') },
      },
    },
    '/admin/subscriptions/{id}/cancel': {
      post: {
        tags: ['Admin'],
        summary: 'Cancel subscription',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody([], {
          reason: { type: 'string', example: 'Admin cancellation' },
        }),
        responses: { '200': okResponse('Subscription cancelled') },
      },
    },
    '/admin/subscriptions/{id}/reactivate': {
      post: {
        tags: ['Admin'],
        summary: 'Reactivate subscription',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Subscription reactivated') },
      },
    },
    '/admin/plans': {
      get: {
        tags: ['Admin'],
        summary: 'List plans',
        parameters: [
          { name: 'includeArchived', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: { '200': okResponse('Plans fetched') },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create plan',
        requestBody: jsonRequestBody(['name', 'price', 'billingInterval'], {
          name: { type: 'string', example: 'Pro' },
          price: { type: 'number', example: 9.99 },
          billingInterval: { type: 'string', enum: ['MONTHLY', 'YEARLY'] },
          features: { type: 'array', items: { type: 'string' } },
          stripePriceId: { type: 'string', example: 'price_123' },
        }),
        responses: { '201': okResponse('Plan created') },
      },
    },
    '/admin/plans/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update plan',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody([], {
          name: { type: 'string', example: 'Pro' },
          price: { type: 'number', example: 9.99 },
          billingInterval: { type: 'string', enum: ['MONTHLY', 'YEARLY'] },
          features: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean', example: true },
        }),
        responses: { '200': okResponse('Plan updated') },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Archive plan',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Plan archived') },
      },
    },
    '/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: 'List global categories',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': okResponse('Global categories fetched') },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create global category',
        requestBody: jsonRequestBody(['name', 'type'], {
          name: { type: 'string', example: 'Food' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          icon: { type: 'string', example: 'utensils' },
          color: { type: 'string', example: '#f97316' },
        }),
        responses: { '201': okResponse('Global category created') },
      },
    },
    '/admin/categories/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update global category',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody([], {
          name: { type: 'string', example: 'Food' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          icon: { type: 'string', example: 'utensils' },
          color: { type: 'string', example: '#f97316' },
        }),
        responses: { '200': okResponse('Global category updated') },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete global category',
        parameters: [uuidPathParameter()],
        responses: { '200': okResponse('Global category deleted') },
      },
    },
    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'List audit logs',
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'actorId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': okResponse('Audit logs fetched') },
      },
    },
    '/admin/email-templates': {
      get: {
        tags: ['Admin'],
        summary: 'List email templates',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': okResponse('Email templates fetched') },
      },
    },
    '/admin/email-templates/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update email template',
        parameters: [uuidPathParameter()],
        requestBody: jsonRequestBody([], {
          subject: { type: 'string', example: 'Welcome to Expense Tracker' },
          body: { type: 'string', example: '<p>Hello {{name}}</p>' },
          isActive: { type: 'boolean', example: true },
        }),
        responses: { '200': okResponse('Email template updated') },
      },
    },
    '/admin/settings': {
      get: {
        tags: ['Admin'],
        summary: 'Get platform settings',
        responses: { '200': okResponse('Settings fetched') },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update platform settings',
        requestBody: jsonRequestBody([], {
          maintenanceMode: { type: 'boolean', example: false },
          allowRegistration: { type: 'boolean', example: true },
          defaultCurrency: { type: 'string', example: 'BDT' },
        }),
        responses: { '200': okResponse('Settings updated') },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform statistics',
        responses: { '200': okResponse('Platform stats fetched') },
      },
    },
  },
};

for (const pathItem of Object.values(
  openApiSpec.paths as Record<
    string,
    Record<string, OpenApiOperation> | undefined
  >,
)) {
  if (!pathItem) continue;

  for (const operation of Object.values(pathItem)) {
    enrichOperation(operation);
  }
}

const hasPathParams = (path: string) => /\{[^}]+\}/.test(path);

for (const [path, pathItem] of Object.entries(
  openApiSpec.paths as Record<
    string,
    Record<string, Record<string, unknown>> | undefined
  >,
)) {
  if (!pathItem) continue;

  for (const [method, operation] of Object.entries(pathItem)) {
    const responses = (operation.responses ?? {}) as Record<string, unknown>;
    const inputValidation =
      method !== 'get' ||
      Boolean((operation as Record<string, unknown>).requestBody) ||
      Boolean((operation as Record<string, unknown>).parameters);
    const isPublicRoute =
      Array.isArray(operation.security) && operation.security.length === 0;
    const isAdminRoute = path.startsWith('/admin');

    const injected: Record<string, unknown> = {
      500: apiErrorResponse(500, 'Internal server error'),
    };

    if (inputValidation) {
      injected[400] = apiErrorResponse(400, 'Validation failed');
    }

    if (!isPublicRoute) {
      injected[401] = apiErrorResponse(401, 'Authentication token is required');
    }

    if (isAdminRoute) {
      injected[403] = apiErrorResponse(
        403,
        'You do not have permission to access this resource',
      );
    }

    if (hasPathParams(path)) {
      injected[404] = apiErrorResponse(404, 'Resource not found');
    }

    operation.responses = {
      ...injected,
      ...responses,
    };
  }
}

export { openApiSpec };
