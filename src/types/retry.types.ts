import { z } from 'zod';

export const RetryConfigSchema = z.object({
  maxRetries: z
    .number()
    .int()
    .min(1, 'maxRetries must be at least 1')
    .max(10, 'maxRetries must not exceed 10'),
  initialDelayMs: z.number().int().positive('initialDelayMs must be positive'),
  maxDelayMs: z.number().int().positive('maxDelayMs must be positive'),
  backoffMultiplier: z
    .number()
    .positive('backoffMultiplier must be positive')
    .min(1, 'backoffMultiplier must be at least 1'),
});

export const RetryConfigPartialSchema = RetryConfigSchema.partial();

export type RetryConfig = z.infer<typeof RetryConfigSchema>;

export interface RetryOptions<T> {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
  onSuccess?: (attempt: number) => void;
}
