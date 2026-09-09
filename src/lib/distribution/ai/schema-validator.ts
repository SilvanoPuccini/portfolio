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
  icon_num: z.number().int().min(1).max(6).optional(),
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
    .length(10, 'LinkedIn debe tener exactamente 10 slides')
    .refine((s) => s[0]?.type === 'portada', 'Slide 1 debe ser portada')
    .refine((s) => s[1]?.type === 'problema', 'Slide 2 debe ser problema')
    .refine((s) => s[2]?.type === 'idea', 'Slide 3 debe ser idea')
    .refine((s) => s[3]?.type === 'idea', 'Slide 4 debe ser idea')
    .refine((s) => s[4]?.type === 'idea', 'Slide 5 debe ser idea')
    .refine((s) => s[5]?.type === 'idea', 'Slide 6 debe ser idea')
    .refine((s) => s[6]?.type === 'idea', 'Slide 7 debe explicar el tradeoff')
    .refine((s) => s[7]?.type === 'idea', 'Slide 8 debe explicar cuándo no aplica')
    .refine((s) => s[8]?.type === 'resumen', 'Slide 9 debe ser resumen')
    .refine((s) => s[9]?.type === 'engagement', 'Slide 10 debe pedir un comentario'),
  caption: z.string().min(600).max(1800)
    .refine((text) => (text.split('\n')[0]?.length ?? 0) <= 140, 'La primera línea supera 140 caracteres')
    .refine((text) => !/https?:\/\/|www\./i.test(text), 'LinkedIn no admite links en el cuerpo')
    .refine((text) => !/🚀|¿Sabías que|En este post te cuento/i.test(text), 'El texto usa una fórmula editorial prohibida'),
  hashtags: z
    .array(z.string().regex(/^[^#\s]/, 'Los hashtags no deben incluir el símbolo #'))
    .max(2),
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
