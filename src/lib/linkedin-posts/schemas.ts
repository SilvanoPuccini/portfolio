import { z } from 'zod';
import { postPublicationSlugSchema } from '@/lib/post-publications/schemas';

export const linkedinSlugSchema = postPublicationSlugSchema;
export const linkedinStatusSchema = z.enum(['planificado', 'preaprobado', 'publicado']);

export const createLinkedInPostSchema = z.strictObject({
  slug: linkedinSlugSchema,
  post_slug: postPublicationSlugSchema,
  slot: z.enum(['martes', 'viernes']),
  source_markdown: z.string().min(1).max(250_000),
  source_filename: z.string().trim().min(1).max(200).regex(/^[^/\\]+\.md$/i, 'El archivo debe ser .md'),
});

export const updateLinkedInPostSchema = z.strictObject({
  title: z.string().trim().min(1).max(300).optional(),
  body: z.string().max(250_000).optional(),
  scheduled_at: z.iso.datetime({ offset: true }).optional(),
  status: linkedinStatusSchema.optional(),
  published_url: z.union([z.literal(''), z.url({ protocol: /^https$/ })]).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Nada para actualizar');

export const pdfUploadSchema = z.strictObject({
  filename: z.string().trim().min(5).max(200).regex(/^[^/\\]+\.pdf$/i, 'El archivo debe ser PDF'),
  size: z.number().int().min(1).max(25 * 1024 * 1024),
  content_type: z.literal('application/pdf'),
});

export const pdfUploadCompleteSchema = pdfUploadSchema.extend({
  path: z.string().regex(/^linkedin\/[a-z0-9]+(?:-[a-z0-9]+)*\/[0-9a-f-]{36}\.pdf$/),
});
