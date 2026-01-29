import { ConfigSchema, ConfigType } from './types';

export class Config {
  private static config: ConfigType;

  static initialize(): void {
    const config = ConfigSchema.parse({
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
      DB_NAME: process.env.DB_NAME || 'hackernews',
      DB_USER: process.env.DB_USER || 'root',
      DB_PASSWORD: process.env.DB_PASSWORD || 'root',
      HACKERNEWS_API_URL:
        process.env.HACKERNEWS_API_URL ||
        'https://hacker-news.firebaseio.com/v0',
      MAX_STORIES: parseInt(process.env.MAX_STORIES || '100', 10),
      REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10),
    });
    Config.config = config;
  }

  static get DB_HOST(): string {
    return Config.config.DB_HOST;
  }

  static get DB_PORT(): number {
    return Config.config.DB_PORT;
  }

  static get DB_NAME(): string {
    return Config.config.DB_NAME;
  }

  static get DB_USER(): string {
    return Config.config.DB_USER;
  }

  static get DB_PASSWORD(): string {
    return Config.config.DB_PASSWORD;
  }

  static get HACKERNEWS_API_URL(): string {
    return Config.config.HACKERNEWS_API_URL;
  }

  static get MAX_STORIES(): number {
    return Config.config.MAX_STORIES;
  }

  static get REQUEST_TIMEOUT(): number {
    return Config.config.REQUEST_TIMEOUT;
  }

  static getDatabaseConfig() {
    return {
      type: 'postgres' as const,
      host: this.DB_HOST,
      port: this.DB_PORT,
      username: this.DB_USER,
      password: this.DB_PASSWORD,
      database: this.DB_NAME,
      synchronize: true,
      logging: false,
    };
  }
}
