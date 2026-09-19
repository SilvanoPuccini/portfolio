import { afterEach, describe, expect, it } from 'vitest';
import { replyToAddress, replyToField } from '@/lib/resend';

const saved = process.env.REPLY_TO_EMAIL;

describe('reply-to de nuestros correos', () => {
  afterEach(() => {
    if (saved === undefined) delete process.env.REPLY_TO_EMAIL;
    else process.env.REPLY_TO_EMAIL = saved;
  });

  it('sin la variable no agrega nada: el comportamiento de siempre', () => {
    // Se activa recién cuando la dirección recibe de verdad. Antes, las
    // respuestas irían a un buzón que no existe.
    delete process.env.REPLY_TO_EMAIL;
    expect(replyToAddress()).toBeUndefined();
    expect(replyToField()).toEqual({});
  });

  it('con la variable, las respuestas van a esa dirección', () => {
    process.env.REPLY_TO_EMAIL = 'hola@silvanopuccini.dev';
    expect(replyToField()).toEqual({ replyTo: 'hola@silvanopuccini.dev' });
  });

  it('una variable vacía cuenta como no configurada', () => {
    process.env.REPLY_TO_EMAIL = '   ';
    expect(replyToField()).toEqual({});
  });
});
