import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, isProduction } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeMonitoring } from './config/monitoring.js';
import { setupSwagger } from './docs/swagger.js';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error.middleware.js';
import { csrfProtection } from './middlewares/csrf.middleware.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { maintenanceMode } from './middlewares/maintenance.middleware.js';
import adminRoutes from './modules/admin/routes.js';
import authRoutes from './modules/auth/routes.js';
import budgetRoutes from './modules/budget/routes.js';
import billingRoutes, {
  billingWebhookRoutes,
} from './modules/billing/routes.js';
import categoryRoutes from './modules/category/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import familyRoutes from './modules/family/routes.js';
import notificationRoutes from './modules/notification/routes.js';
import reportRoutes from './modules/report/routes.js';
import savingsGoalRoutes from './modules/savingsGoal/routes.js';
import transactionRoutes from './modules/transaction/routes.js';
import userRoutes from './modules/user/routes.js';
import { sendResponse } from './utils/response.js';

const app = express();
initializeMonitoring();
app.set('trust proxy', 1);

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) =>
  origin.trim(),
);

app.use(helmet());
app.use((req, _res, next) => {
  if (isProduction && req.get('x-forwarded-proto') !== 'https' && !req.secure) {
    return next(new Error('HTTPS is required'));
  }
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(pinoHttp({ logger }));
app.use(apiRateLimiter);

// Stripe signature verification requires the untouched request body.
app.use('/api/billing/webhook', billingWebhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(maintenanceMode);

setupSwagger(app);

app.get('/health', (_req, res) => {
  sendResponse(res, 200, 'Expense Tracker API is healthy', {
    service: 'expense-tracker-api',
    environment: env.NODE_ENV,
  });
});

app.get('/api', (_req, res) => {
  sendResponse(res, 200, 'Expense Tracker API', {
    docs: '/api/docs',
    health: '/health',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
