import z from 'zod';

export const ConfigSchema = z.object({
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.number().int().positive(),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  HACKERNEWS_API_URL: z.string().url(),
  MAX_STORIES: z.number().int().positive(),
  REQUEST_TIMEOUT: z.number().int().positive(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
