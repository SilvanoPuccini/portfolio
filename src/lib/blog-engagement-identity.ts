import { createHmac, randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'blog_visitor';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const VISITOR_ID_PATTERN = /^[a-f0-9]{64}$/;

export type EngagementIdentity = {
  visitorHash: string;
  visitorId: string;
  isNew: boolean;
};

export function getEngagementIdentity(req: NextRequest): EngagementIdentity | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const storedId = req.cookies.get(COOKIE_NAME)?.value;
  const isStoredIdValid = storedId !== undefined && VISITOR_ID_PATTERN.test(storedId);
  const visitorId = isStoredIdValid ? storedId : randomBytes(32).toString('hex');
  const visitorHash = createHmac('sha256', secret)
    .update('blog-engagement:v1\0')
    .update(visitorId)
    .digest('hex');

  return { visitorHash, visitorId, isNew: !isStoredIdValid };
}

export function setEngagementCookie(response: NextResponse, identity: EngagementIdentity): void {
  if (!identity.isNew) return;

  response.cookies.set(COOKIE_NAME, identity.visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}
