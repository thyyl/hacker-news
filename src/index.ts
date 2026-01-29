import pino from 'pino';
import { Config } from './config';
import { Database } from './database';
import { HackerNewsFetcher } from './fetcher';

const logger = pino({ name: 'HackerNewsFetcher' });

async function main() {
  const startTime = new Date();
  logger.info('Starting Hacker News Fetcher');
  logger.info({ startTime: startTime.toISOString() });

  try {
    logger.info('Validating and initializing configuration');
    Config.initialize();
    logger.info(
      {
        database: `${Config.DB_HOST}:${Config.DB_PORT}/${Config.DB_NAME}`,
        maxStories: Config.MAX_STORIES,
      },
      'Configuration validated',
    );

    logger.info('Initializing database connection');
    const db = Database.getInstance();
    await db.initialize();

    if (!(await db.testConnection())) {
      throw new Error('Database connection test failed');
    }

    logger.info('Initializing Hacker News fetcher');
    const fetcher = new HackerNewsFetcher();

    logger.info('Starting fetch operation');
    const result = await fetcher.fetchAndSave(
      db.getStoryRepository(),
      db.getFetchLogRepository(),
    );

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    logger.info(
      {
        success: result.success,
        totalFetched: result.totalFetched,
        newStories: result.newStories,
        updatedStories: result.updatedStories,
        durationSeconds: duration.toFixed(2),
      },
      'Fetch operation completed',
    );

    if (result.errors.length > 0) {
      logger.warn(
        { errorCount: result.errors.length, errors: result.errors },
        'Errors encountered during fetch',
      );
    }

    await db.close();

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logger.error({ err: error }, 'FATAL ERROR');
    process.exit(1);
  }
}

main();
