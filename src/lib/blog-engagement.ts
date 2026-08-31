import { z } from 'zod';

export const blogSlugSchema = z.string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const reactionSchema = z.enum(['like', 'dislike']);

export const engagementActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('view') }).strict(),
  z.object({ action: z.literal('share') }).strict(),
  z.object({ action: z.literal('reaction'), reaction: reactionSchema.nullable() }).strict(),
]);

export type Reaction = z.infer<typeof reactionSchema>;

export type PublicEngagement = {
  likeCount: number;
  reaction: Reaction | null;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
