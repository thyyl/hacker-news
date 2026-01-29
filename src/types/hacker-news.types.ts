import z from 'zod';

export const StoryIdSchema = z.number().int().positive();
export const StoryIdsResponseSchema = z.array(StoryIdSchema);

export const HackerNewsStorySchema = z.object({
  id: StoryIdSchema,
  title: z.string().optional(),
  url: z.string().url().optional(),
  text: z.string().optional(),
  score: z.number().int().nonnegative().optional().default(0),
  by: z.string().optional(),
  time: z.number().int().optional().default(0),
  descendants: z.number().int().nonnegative().optional().default(0),
  type: z.string().optional(),
  dead: z.boolean().optional().default(false),
  deleted: z.boolean().optional().default(false),
});

export type HackerNewsStory = z.infer<typeof HackerNewsStorySchema>;
