import {
  RetryConfig,
  RetryConfigPartialSchema,
  RetryConfigSchema,
  RetryOptions,
} from './types/retry.types';

/**
 * Generic retry service for handling exponential backoff retry logic
 * Can be used by any service that needs to retry operations
 */
export class RetryService {
  private defaultConfig: RetryConfig;

  /**
   * Initialize RetryService with default retry configuration
   * @param config Optional retry configuration. Uses sensible defaults if not provided.
   * @throws {z.ZodError} If configuration validation fails
   */
  constructor(config?: Partial<RetryConfig>) {
    const validatedConfig = RetryConfigPartialSchema.parse(config || {});

    this.defaultConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      ...validatedConfig,
    };

    // Validate final merged config
    RetryConfigSchema.parse(this.defaultConfig);
  }

  /**
   * Execute a function with automatic retry and exponential backoff
   * @param fn The async function to execute
   * @param options Retry options for this specific call
   * @returns The result of the function
   * @throws The last error if all retries are exhausted
   */
  async execute<T>(
    fn: () => Promise<T>,
    options?: RetryOptions<T>,
  ): Promise<T> {
    const config = this.mergeConfig(options);
    let lastError: Error | null = null;
    let delay = config.initialDelayMs;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await fn();
        options?.onSuccess?.(attempt);
        return result;
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === config.maxRetries;
        const shouldRetry =
          !isLastAttempt &&
          (options?.shouldRetry?.(lastError) ??
            this.isRetryableError(lastError));

        if (shouldRetry) {
          options?.onRetry?.(attempt, lastError, delay);
          await this.sleep(delay);
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
        } else if (isLastAttempt) {
          throw lastError;
        } else {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error is retryable (network errors, timeouts, 5xx status codes)
   * @param error The error to check
   * @returns True if the error should be retried
   */
  private isRetryableError(error: Error): boolean {
    // Check for network-related errors
    if (error.message.includes('ECONNREFUSED')) return true;
    if (error.message.includes('ETIMEDOUT')) return true;
    if (error.message.includes('ENOTFOUND')) return true;
    if (error.message.includes('timeout')) return true;

    // Check for axios errors with status codes
    const axiosError = error as any;
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      // Retry on 5xx errors and 429 (too many requests)
      return (status >= 500 && status < 600) || status === 429;
    }

    // Check for generic error types
    if (error.name === 'TimeoutError') return true;
    if (error.name === 'NetworkError') return true;

    return false;
  }

  /**
   * Sleep for a given number of milliseconds
   * @param ms Number of milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Merge provided options with default config
   */
  private mergeConfig(options?: RetryOptions<unknown>): Required<RetryConfig> {
    return {
      maxRetries: options?.maxRetries ?? this.defaultConfig.maxRetries,
      initialDelayMs:
        options?.initialDelayMs ?? this.defaultConfig.initialDelayMs,
      maxDelayMs: options?.maxDelayMs ?? this.defaultConfig.maxDelayMs,
      backoffMultiplier:
        options?.backoffMultiplier ?? this.defaultConfig.backoffMultiplier,
    };
  }

  /**
   * Update the default configuration
   */
  setDefaultConfig(config: Partial<RetryConfig>): void {
    const validatedConfig = RetryConfigPartialSchema.parse(config);
    this.defaultConfig = { ...this.defaultConfig, ...validatedConfig };
    // Validate final merged config
    RetryConfigSchema.parse(this.defaultConfig);
  }

  /**
   * Get the current default configuration
   */
  getDefaultConfig(): RetryConfig {
    return { ...this.defaultConfig };
  }
}

/**
 * Create a singleton instance for global use
 */
export const retryService = new RetryService();

/**
 * Re-export types for convenience
 */
export { RetryConfigPartialSchema, RetryConfigSchema };
export type { RetryConfig, RetryOptions };
