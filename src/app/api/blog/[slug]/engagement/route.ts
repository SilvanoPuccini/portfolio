import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/mdx';
import type { BlogPost } from '@/types/blog';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getVisibilityIndex, isPostVisible } from '@/lib/post-publications/visibility';
import { rateLimit } from '@/lib/rate-limit';
import {
  blogSlugSchema,
  engagementActionSchema,
  reactionSchema,
  type ApiError,
  type PublicEngagement,
  type Reaction,
} from '@/lib/blog-engagement';
import {
  getEngagementIdentity,
  setEngagementCookie,
  type EngagementIdentity,
} from '@/lib/blog-engagement-identity';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };
type PublicResponse = { data: PublicEngagement };

function errorResponse(code: string, message: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function validateRequest(
  req: NextRequest,
  context: RouteContext,
  rateLimitCount: number,
): Promise<{ slug: string; post: BlogPost; identity: EngagementIdentity } | NextResponse<ApiError>> {
  if (!rateLimit(`blog-engagement:${getIp(req)}`, rateLimitCount, 60_000)) {
    const response = errorResponse('RATE_LIMITED', 'Too many requests. Try again shortly.', 429);
    response.headers.set('Retry-After', '60');
    return response;
  }

  const parsedSlug = blogSlugSchema.safeParse((await context.params).slug);
  if (!parsedSlug.success) {
    return errorResponse('INVALID_SLUG', 'Invalid post slug.', 400);
  }

  const post = await getBlogPostBySlug(parsedSlug.data);
  if (!post) {
    return errorResponse('POST_NOT_FOUND', 'Post not found.', 404);
  }

  const identity = getEngagementIdentity(req);
  if (!identity) {
    return errorResponse('SERVICE_UNAVAILABLE', 'Engagement is temporarily unavailable.', 503);
  }

  return { slug: parsedSlug.data, post, identity };
}

async function getPublicEngagement(slug: string, visitorHash: string): Promise<PublicEngagement> {
  const supabase = getSupabaseAdmin();
  const [likesResult, reactionResult] = await Promise.all([
    supabase
      .from('post_reactions')
      .select('post_slug', { count: 'exact', head: true })
      .eq('post_slug', slug)
      .eq('reaction', 'like'),
    supabase
      .from('post_reactions')
      .select('reaction')
      .eq('post_slug', slug)
      .eq('visitor_hash', visitorHash)
      .maybeSingle(),
  ]);

  if (likesResult.error || reactionResult.error) throw new Error('engagement query failed');

  const parsedReaction = reactionSchema.safeParse(reactionResult.data?.reaction);
  return {
    likeCount: likesResult.count ?? 0,
    reaction: parsedReaction.success ? parsedReaction.data : null,
  };
}

export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const validated = await validateRequest(req, context, 60);
  if (validated instanceof NextResponse) return validated;

  try {
    const data = await getPublicEngagement(validated.slug, validated.identity.visitorHash);
    const response = NextResponse.json<PublicResponse>({ data });
    setEngagementCookie(response, validated.identity);
    return response;
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Unable to load engagement.', 500);
  }
}

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const validated = await validateRequest(req, context, 30);
  if (validated instanceof NextResponse) return validated;

  // Un post que todavía no salió no puede acumular métricas: cada vez que se
  // abre el preview de un preaprobado se sumaba una vista real y las
  // estadísticas terminaban con visitas que ningún lector hizo. Solo se
  // bloquea la escritura; el GET sigue respondiendo para que el preview se
  // vea igual que el post publicado.
  if (!isPostVisible(validated.post, await getVisibilityIndex())) {
    return errorResponse('POST_NOT_PUBLISHED', 'Post is not published yet.', 404);
  }

  let parsedBody: ReturnType<typeof engagementActionSchema.safeParse>;
  try {
    parsedBody = engagementActionSchema.safeParse(await req.json());
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid request body.', 400);
  }
  if (!parsedBody.success) {
    return errorResponse('INVALID_ACTION', 'Invalid engagement action.', 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const common = {
      post_slug: validated.slug,
      visitor_hash: validated.identity.visitorHash,
    };

    if (parsedBody.data.action === 'view' || parsedBody.data.action === 'share') {
      const { error } = await supabase.from('post_engagement_events').upsert(
        { ...common, event_type: parsedBody.data.action },
        {
          onConflict: 'post_slug,visitor_hash,event_type,event_date',
          ignoreDuplicates: true,
        },
      );
      if (error) throw new Error('engagement event write failed');

      const response = NextResponse.json({ data: { recorded: true } });
      setEngagementCookie(response, validated.identity);
      return response;
    }

    const reaction: Reaction | null = parsedBody.data.reaction;
    if (reaction === null) {
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_slug', validated.slug)
        .eq('visitor_hash', validated.identity.visitorHash);
      if (error) throw new Error('reaction delete failed');
    } else {
      const { error } = await supabase.from('post_reactions').upsert(
        { ...common, reaction, updated_at: new Date().toISOString() },
        { onConflict: 'post_slug,visitor_hash' },
      );
      if (error) throw new Error('reaction write failed');
    }

    const data = await getPublicEngagement(validated.slug, validated.identity.visitorHash);
    const response = NextResponse.json<PublicResponse>({ data });
    setEngagementCookie(response, validated.identity);
    return response;
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Unable to update engagement.', 500);
  }
}
