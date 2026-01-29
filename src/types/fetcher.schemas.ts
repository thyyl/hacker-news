import { z } from 'zod';
import { RetryService } from '../retry';

export const FetcherConfigSchema = z.object({
  apiUrl: z.string().url().optional(),
  retryService: z.instanceof(RetryService).optional(),
});

export const FetchNewStoriesLimitSchema = z
  .number()
  .int()
  .positive()
  .optional();

export const FetchStoryIdSchema = z.number().int().positive();

export interface FetchResult {
  success: boolean;
  totalFetched: number;
  newStories: number;
  updatedStories: number;
  errors: string[];
}

export interface FetchStats {
  new: number;
  updated: number;
}
