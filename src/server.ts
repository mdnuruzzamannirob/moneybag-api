import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { scheduleBudgetAlertJob } from './jobs/budgetAlert.job.js';
import { scheduleRecurringTransactionJob } from './jobs/recurringTransaction.job.js';

const bootstrap = async () => {
  await connectDatabase();
  await connectRedis();

  if (env.NODE_ENV !== 'test') {
    scheduleRecurringTransactionJob();
    scheduleBudgetAlertJob();
  }

  const server = app.listen(env.PORT, () => {
    console.info(
      `Expense Tracker API listening on http://localhost:${env.PORT}`,
    );
  });

  const shutdown = async (signal: string) => {
    console.info(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

void bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
