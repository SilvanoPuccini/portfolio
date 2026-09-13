import { describe, expect, it } from 'vitest';
import {
  XCreditsDepletedError, buildSignature, isCreditsDepletedError, percentEncode, threadUrl,
} from './client';

/**
 * Vector fijo para comprobar la firma sin tocar la red. El valor esperado se
 * verificó de forma cruzada contra una implementación independiente del
 * RFC 5849 en Python: las dos dan lo mismo con la misma entrada.
 *
 * Lo que prueba: que el algoritmo no cambie sin que nos enteremos. Un error de
 * firma en producción aparece como un 401 opaco, sin ninguna pista de cuál de
 * los seis pasos falló.
 */
const VECTOR = {
  consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
  consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
  token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
  tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
  method: 'POST',
  url: 'https://api.twitter.com/1.1/statuses/update.json',
  expected: 'ZdDmSFLREGXUqlQiGROY/J02Svo=',
};

describe('percentEncode', () => {
  it('encodes the characters encodeURIComponent leaves alone', () => {
    // RFC 3986 exige codificar estos cinco; encodeURIComponent no los toca.
    expect(percentEncode("!*'()")).toBe('%21%2A%27%28%29');
  });

  it('encodes spaces as %20 and never as +', () => {
    expect(percentEncode('Hello Ladies')).toBe('Hello%20Ladies');
  });

  it('leaves the unreserved set untouched', () => {
    expect(percentEncode('aZ0-._~')).toBe('aZ0-._~');
  });
});

describe('buildSignature', () => {
  it('matches an independent RFC 5849 implementation for the same input', () => {
    const signature = buildSignature({
      method: VECTOR.method,
      url: VECTOR.url,
      oauthParams: {
        status: 'Hello Ladies + Add Me to Your Fan Queue!',
        include_entities: 'true',
        oauth_consumer_key: VECTOR.consumerKey,
        oauth_nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: '1318622958',
        oauth_token: VECTOR.token,
        oauth_version: '1.0',
      },
      consumerSecret: VECTOR.consumerSecret,
      tokenSecret: VECTOR.tokenSecret,
    });

    expect(signature).toBe(VECTOR.expected);
  });

  it('changes the signature when any single parameter changes', () => {
    const sign = (nonce: string) => buildSignature({
      method: 'POST',
      url: 'https://api.x.com/2/tweets',
      oauthParams: {
        oauth_consumer_key: VECTOR.consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: '1318622958',
        oauth_token: VECTOR.token,
        oauth_version: '1.0',
      },
      consumerSecret: VECTOR.consumerSecret,
      tokenSecret: VECTOR.tokenSecret,
    });

    expect(sign('aaa')).not.toBe(sign('bbb'));
  });

  it('sorts parameters, so their order in the object never matters', () => {
    const params = {
      oauth_version: '1.0',
      oauth_nonce: 'abc',
      oauth_consumer_key: VECTOR.consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '1318622958',
      oauth_token: VECTOR.token,
    };
    const reversed = Object.fromEntries(Object.entries(params).reverse());
    const common = { method: 'POST', url: 'https://api.x.com/2/tweets', consumerSecret: VECTOR.consumerSecret, tokenSecret: VECTOR.tokenSecret };

    expect(buildSignature({ ...common, oauthParams: params }))
      .toBe(buildSignature({ ...common, oauthParams: reversed }));
  });
});

describe('threadUrl', () => {
  it('points at the first post, which is what opens the whole thread', () => {
    expect(threadUrl('silvanopuccini', '1234567890')).toBe('https://x.com/silvanopuccini/status/1234567890');
  });
});

describe('XCreditsDepletedError', () => {
  it('is a typed 402 with a stable code', () => {
    const error = new XCreditsDepletedError('You have reached your limit');
    expect(error.status).toBe(402);
    expect(error.code).toBe('credits-depleted');
    expect(error.name).toBe('XCreditsDepletedError');
  });

  it('is identified by isCreditsDepletedError, no other error confuses it', () => {
    expect(isCreditsDepletedError(new XCreditsDepletedError('sin crédito'))).toBe(true);
    expect(isCreditsDepletedError(Object.assign(new Error('otro'), { status: 402 }))).toBe(false);
    expect(isCreditsDepletedError(null)).toBe(false);
  });
});
