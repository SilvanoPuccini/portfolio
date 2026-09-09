import { z } from 'zod';
import { postPublicationSlugSchema } from '@/lib/post-publications/schemas';

export const linkedinSlugSchema = postPublicationSlugSchema;
export const linkedinStatusSchema = z.enum(['planificado', 'preaprobado', 'publicado']);

/**
 * El Markdown es opcional a propósito: una pieza se puede reservar en la agenda
 * con solo el título mientras el texto todavía se está escribiendo. El texto y
 * el PDF se cargan después, por separado, y es la transición de estado la que
 * exige tenerlos a los dos.
 */
export const createLinkedInPostSchema = z.strictObject({
  slug: linkedinSlugSchema,
  post_slug: postPublicationSlugSchema,
  slot: z.enum(['martes', 'viernes']),
  title: z.string().trim().min(1).max(300).optional(),
  source_markdown: z.string().min(1).max(250_000).optional(),
  source_filename: z.string().trim().min(1).max(200).regex(/^[^/\\]+\.md$/i, 'El archivo debe ser .md').optional(),
})
  .refine(
    (value) => Boolean(value.source_markdown) === Boolean(value.source_filename),
    'El Markdown importado necesita su nombre de archivo',
  )
  .refine(
    (value) => Boolean(value.source_markdown) || Boolean(value.title),
    'Poné un título o importá el Markdown',
  );

export const updateLinkedInPostSchema = z.strictObject({
  title: z.string().trim().min(1).max(300).optional(),
  body: z.string().max(250_000).optional(),
  /** Markdown adjuntado desde el detalle: el servidor lo convierte a body. */
  source_markdown: z.string().max(250_000).optional(),
  source_filename: z.string().trim().min(1).max(200).regex(/^[^/\\]+\.md$/i, 'El archivo debe ser .md').optional(),
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
