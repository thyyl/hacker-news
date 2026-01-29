import pino from 'pino';
import { DataSource, Repository } from 'typeorm';
import { Config } from './config';
import { FetchLog, Story } from './models';

export class Database {
  private static instance: Database;
  private dataSource: DataSource;
  private initialized = false;
  private logger: pino.Logger;

  private constructor() {
    this.logger = pino({ name: 'Database' });
    this.dataSource = new DataSource({
      ...Config.getDatabaseConfig(),
      entities: [Story, FetchLog],
    });
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.dataSource.initialize();
      this.initialized = true;
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error({ err: error }, 'Database connection failed');
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.info('Database connection test successful');
      return true;
    } catch (error) {
      this.logger.error({ err: error }, 'Database connection test failed');
      return false;
    }
  }

  getStoryRepository(): Repository<Story> {
    return this.dataSource.getRepository(Story);
  }

  getFetchLogRepository(): Repository<FetchLog> {
    return this.dataSource.getRepository(FetchLog);
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.dataSource.destroy();
      this.initialized = false;
      this.logger.info('Database connection closed');
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
