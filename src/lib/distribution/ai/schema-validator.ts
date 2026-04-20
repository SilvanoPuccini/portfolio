import { z } from 'zod';
import type { GeneratedContent } from '../types';

// ── Slide schema ─────────────────────────────────────────────

const SlideSchema = z.object({
  type: z.enum(['hook', 'content', 'cta']),
  headline: z.string().min(1),
  body: z.string().min(1),
});

// ── Platform schemas ─────────────────────────────────────────

const LinkedInSchema = z.object({
  slides: z
    .array(SlideSchema)
    .min(4, 'LinkedIn debe tener al menos 4 slides')
    .max(8, 'LinkedIn no puede tener más de 8 slides')
    .refine((slides) => slides[0]?.type === 'hook', 'El primer slide debe ser hook')
    .refine(
      (slides) => slides[slides.length - 1]?.type === 'cta',
      'El último slide debe ser cta'
    ),
  caption: z.string().min(10),
  hashtags: z
    .array(z.string().regex(/^[^#\s]/, 'Los hashtags no deben incluir el símbolo #'))
    .min(3)
    .max(10),
});

const InstagramSchema = z.object({
  slides: z
    .array(SlideSchema)
    .min(4)
    .max(10)
    .refine((slides) => slides[0]?.type === 'hook', 'El primer slide debe ser hook')
    .refine(
      (slides) => slides[slides.length - 1]?.type === 'cta',
      'El último slide debe ser cta'
    ),
  caption: z.string().min(10),
  hashtags: z.array(z.string()).min(5).max(20),
});

const TwitterSchema = z.object({
  tweets: z.array(z.string().min(1)).min(3).max(10),
});

export const GeneratedContentSchema = z.object({
  linkedin: LinkedInSchema,
  instagram: InstagramSchema,
  twitter: TwitterSchema,
});

// ── Validator function ───────────────────────────────────────

export function validateGeneratedContent(raw: unknown): GeneratedContent {
  return GeneratedContentSchema.parse(raw) as GeneratedContent;
}

export type ValidationError = z.ZodError;
