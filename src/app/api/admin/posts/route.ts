import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/lib/mdx';

export const dynamic = 'force-dynamic';

import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = getAllBlogPosts();
  return NextResponse.json({ posts });
}
