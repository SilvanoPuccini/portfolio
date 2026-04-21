import { z } from 'zod';
import type { GeneratedContent } from '../types';

// ── LinkedIn slide schema (9-slide fixed structure) ───────────

const LinkedInSlideSchema = z.object({
  type: z.enum(['portada', 'problema', 'idea', 'resumen', 'engagement', 'cta']),
  headline: z.string().min(1),
  body: z.string().min(1),
  tag: z.string().optional(),
  subtitle: z.string().optional(),
  pills: z.array(z.string()).optional(),
  icon_num: z.number().int().min(1).max(4).optional(),
  code_snippet: z.string().optional(),
  points: z.array(z.string()).optional(),
});

// ── Instagram slide schema (simpler) ─────────────────────────

const SlideSchema = z.object({
  type: z.enum(['hook', 'content', 'cta']),
  headline: z.string().min(1),
  body: z.string().min(1),
});

// ── Platform schemas ─────────────────────────────────────────

const LinkedInSchema = z.object({
  slides: z
    .array(LinkedInSlideSchema)
    .length(9, 'LinkedIn debe tener exactamente 9 slides')
    .refine((s) => s[0]?.type === 'portada', 'Slide 1 debe ser portada')
    .refine((s) => s[1]?.type === 'problema', 'Slide 2 debe ser problema')
    .refine((s) => s[2]?.type === 'idea', 'Slide 3 debe ser idea')
    .refine((s) => s[3]?.type === 'idea', 'Slide 4 debe ser idea')
    .refine((s) => s[4]?.type === 'idea', 'Slide 5 debe ser idea')
    .refine((s) => s[5]?.type === 'idea', 'Slide 6 debe ser idea')
    .refine((s) => s[6]?.type === 'resumen', 'Slide 7 debe ser resumen')
    .refine((s) => s[7]?.type === 'engagement', 'Slide 8 debe ser engagement')
    .refine((s) => s[8]?.type === 'cta', 'Slide 9 debe ser cta'),
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
