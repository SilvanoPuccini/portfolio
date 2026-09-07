import { z } from 'zod';

export const postPublicationSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug no es válido');

const editablePostPublicationSchema = z.strictObject({
  raw_title: z.string().trim().min(1, 'El título es obligatorio').max(300),
  raw_content: z.string(),
  scheduled_at: z.iso.datetime({ offset: true }),
  notify_subscribers: z.boolean(),
});

export const createPostPublicationSchema = editablePostPublicationSchema.extend({
  post_slug: postPublicationSlugSchema,
  raw_content: z.string().optional(),
  notify_subscribers: z.boolean().optional(),
});

export const updatePostPublicationSchema = editablePostPublicationSchema
  .extend({
    status: z.enum(['planificado', 'preaprobado', 'publicado']),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nada para actualizar');

export const deletePostPublicationSchema = z.strictObject({
  post_slug: postPublicationSlugSchema,
});

export type CreatePostPublicationRequest = z.infer<typeof createPostPublicationSchema>;
export type UpdatePostPublicationRequest = z.infer<typeof updatePostPublicationSchema>;
