import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import { Repository } from 'typeorm';
import { Config } from './config';
import { FetchLog, Story } from './models';
import { RetryService } from './retry';
import {
  FetcherConfigSchema,
  FetchNewStoriesLimitSchema,
  FetchResult,
  FetchStats,
  HackerNewsStory,
  HackerNewsStorySchema,
  StoryIdSchema,
  StoryIdsResponseSchema,
} from './types';

export class HackerNewsFetcher {
  private client: AxiosInstance;
  private apiUrl: string;
  private retryService: RetryService;
  private logger: pino.Logger;

  constructor(apiUrl?: string, retryService?: RetryService) {
    const validatedConfig = FetcherConfigSchema.parse({
      apiUrl,
      retryService,
    });

    this.apiUrl = validatedConfig.apiUrl || Config.HACKERNEWS_API_URL;
    this.retryService = validatedConfig.retryService || new RetryService();
    this.logger = pino({ name: 'HackerNewsFetcher' });
    this.client = axios.create({
      timeout: Config.REQUEST_TIMEOUT,
    });
  }

  async fetchNewStories(limit?: number): Promise<number[]> {
    const maxStories =
      FetchNewStoriesLimitSchema.parse(limit) || Config.MAX_STORIES;

    try {
      const storyIds = await this.retryService.execute(
        async () => {
          const url = `${this.apiUrl}/newstories.json`;
          const response = await this.client.get<number[]>(url);
          const validated = StoryIdsResponseSchema.parse(response.data);
          return validated.slice(0, maxStories);
        },
        {
          onRetry: (attempt, error, nextDelayMs) => {
            this.logger.warn(
              `Fetching new stories failed (attempt ${attempt}). Retrying in ${nextDelayMs}ms. Error: ${error.message}`,
            );
          },
        },
      );
      this.logger.info(`Successfully fetched ${storyIds.length} new story IDs`);
      return storyIds;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to fetch new stories');
      throw error;
    }
  }

  async fetchStory(storyId: number): Promise<HackerNewsStory | null> {
    try {
      StoryIdSchema.parse(storyId);

      const storyData = await this.retryService.execute(
        async () => {
          const url = `${this.apiUrl}/item/${storyId}.json`;
          const response = await this.client.get<HackerNewsStory>(url);
          return HackerNewsStorySchema.parse(response.data);
        },
        {
          onRetry: (attempt, error, nextDelayMs) => {
            this.logger.debug(
              `Story ${storyId} fetch failed (attempt ${attempt}). Retrying in ${nextDelayMs}ms. Error: ${error.message}`,
            );
          },
        },
      );
      return storyData;
    } catch (error) {
      this.logger.warn(
        { err: error },
        `Error fetching story ${storyId} after retries`,
      );
      return null;
    }
  }

  async saveStories(
    storyRepository: Repository<Story>,
    stories: HackerNewsStory[],
  ): Promise<FetchStats> {
    let newCount = 0;
    let updatedCount = 0;

    for (const storyData of stories) {
      try {
        // Check if story exists
        const existingStory = await storyRepository.findOne({
          where: { hnId: storyData.id },
        });

        if (existingStory) {
          // Update existing story
          existingStory.title = storyData.title || '';
          existingStory.score = storyData.score || 0;
          existingStory.descendants = storyData.descendants || 0;
          existingStory.updatedAt = new Date();

          await storyRepository.save(existingStory);
          updatedCount++;
        } else {
          // Create new story
          const newStory = storyRepository.create({
            hnId: storyData.id,
            title: storyData.title || '',
            url: storyData.url,
            text: storyData.text,
            score: storyData.score || 0,
            by: storyData.by,
            time: storyData.time || 0,
            descendants: storyData.descendants || 0,
            storyType: storyData.type,
            dead: storyData.dead || false,
            deleted: storyData.deleted || false,
          });

          await storyRepository.save(newStory);
          newCount++;
        }
      } catch (error) {
        this.logger.error({ err: error }, `Error saving story ${storyData.id}`);
        continue;
      }
    }

    this.logger.info({ newCount, updatedCount }, 'Database save complete');
    return { new: newCount, updated: updatedCount };
  }

  async fetchAndSave(
    storyRepository: Repository<Story>,
    fetchLogRepository: Repository<FetchLog>,
  ): Promise<FetchResult> {
    const fetchLog = fetchLogRepository.create({
      startedAt: new Date(),
    });
    await fetchLogRepository.save(fetchLog);

    const errors: string[] = [];
    const allStories: HackerNewsStory[] = [];

    try {
      this.logger.info('Starting fetch operation');

      // Fetch both top and new stories
      const newStoryIds = await this.fetchNewStories();
      this.logger.info({ count: newStoryIds.length }, 'Processing story IDs');

      // Fetch individual stories
      for (let i = 0; i < newStoryIds.length; i++) {
        const storyId = newStoryIds[i];

        if ((i + 1) % 10 === 0) {
          this.logger.info(
            { current: i + 1, total: newStoryIds.length },
            'Fetch progress',
          );
        }

        const storyData = await this.fetchStory(storyId);
        if (storyData) {
          allStories.push(storyData);
        }

        // Rate limiting
        await this.sleep(100);
      }

      this.logger.info({ count: allStories.length }, 'API fetch complete');

      // Save to database
      const stats = await this.saveStories(storyRepository, allStories);

      // Update fetch log
      fetchLog.completedAt = new Date();
      fetchLog.storiesFetched = allStories.length;
      fetchLog.storiesNew = stats.new;
      fetchLog.storiesUpdated = stats.updated;
      fetchLog.success = true;
      await fetchLogRepository.save(fetchLog);

      return {
        success: true,
        totalFetched: allStories.length,
        newStories: stats.new,
        updatedStories: stats.updated,
        errors,
      };
    } catch (error) {
      const errorMsg = `Fetch operation failed: ${error}`;
      this.logger.error({ err: error }, 'Fetch operation failed');
      errors.push(errorMsg);

      fetchLog.completedAt = new Date();
      fetchLog.errors = errors.join('\n');
      fetchLog.success = false;
      await fetchLogRepository.save(fetchLog);

      return {
        success: false,
        totalFetched: allStories.length,
        newStories: 0,
        updatedStories: 0,
        errors,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
