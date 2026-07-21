import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { scheduleBudgetAlertJob } from './jobs/budgetAlert.job.js';
import { scheduleRecurringTransactionJob } from './jobs/recurringTransaction.job.js';
import { scheduleSubscriptionTrialJob } from './jobs/subscriptionTrial.job.js';
import { ensureApplicationDefaults } from './services/bootstrap.service.js';

const bootstrap = async () => {
  await connectDatabase();
  await connectRedis();
  await ensureApplicationDefaults();

  if (env.NODE_ENV !== 'test' && env.SCHEDULER_ENABLED) {
    scheduleRecurringTransactionJob();
    scheduleBudgetAlertJob();
    scheduleSubscriptionTrialJob();
  }

  const server = app.listen(env.PORT, () => {
    logger.info(
      `Expense Tracker API listening on http://localhost:${env.PORT}`,
    );
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
