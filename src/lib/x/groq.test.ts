import { SchemaType, type Schema } from '@google/generative-ai';
import { describe, expect, it } from 'vitest';
import { toJsonSchema } from './groq';

/**
 * El esquema se traduce del SchemaType de Gemini (PascalCase) a JSON Schema
 * plano porque Groq usa el formato OpenAI. Si la traducción dejara de existir,
 * el fallback de cuota rompería despacio y lejos del error real.
 */
describe('toJsonSchema', () => {
  it('renders a string field as a plain JSON Schema type', () => {
    const schema: Schema = { type: SchemaType.STRING, description: 'un texto' };
    expect(toJsonSchema(schema)).toEqual({ type: 'string' });
  });

  it('keeps enum values for primitive fields', () => {
    const enumSchema = { type: SchemaType.STRING, enum: ['approved', 'rewrite', 'blocked'] } as Schema;
    expect(toJsonSchema(enumSchema)).toEqual({ type: 'string', enum: ['approved', 'rewrite', 'blocked'] });
  });

  it('recurses into objects with required and additionalProperties false', () => {
    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        verdict: { type: SchemaType.STRING, enum: ['ok'] } as Schema,
        count: { type: SchemaType.INTEGER },
        tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['verdict'],
    };
    expect(toJsonSchema(schema)).toEqual({
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['ok'] },
        count: { type: 'integer' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['verdict'],
      additionalProperties: false,
    });
  });
});