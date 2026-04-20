// ============================================================
// Distribution system — core types
// ============================================================

// ── Slide ────────────────────────────────────────────────────

export type SlideType = 'hook' | 'content' | 'cta';

export interface Slide {
  type: SlideType;
  headline: string;
  body: string;
}

// ── Platform content ─────────────────────────────────────────

export interface LinkedInContent {
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

export interface InstagramContent {
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

export interface TwitterContent {
  tweets: string[];
}

export interface GeneratedContent {
  linkedin: LinkedInContent;
  instagram: InstagramContent;
  twitter: TwitterContent;
}

// ── Distribution status ──────────────────────────────────────

export type DistributionStatus = 'draft' | 'approved' | 'published' | 'archived' | 'error';

// ── AI metadata ──────────────────────────────────────────────

export interface AIMetadata {
  model: string;
  tokens_used: number;
  generated_at: string;
  attempts: number;
}

// ── DB row ───────────────────────────────────────────────────

export interface Distribution {
  id: string;
  post_slug: string;
  post_title: string;
  status: DistributionStatus;

  linkedin_content: LinkedInContent | null;
  linkedin_images: string[];

  instagram_content: InstagramContent | null;
  instagram_images: string[];

  twitter_content: TwitterContent | null;

  ai_metadata: AIMetadata | null;
  error_message: string | null;

  created_at: string;
  updated_at: string;
  approved_at: string | null;
  published_at: string | null;
}

export interface DistributionVersion {
  id: string;
  distribution_id: string;
  version_number: number;

  linkedin_content: LinkedInContent | null;
  instagram_content: InstagramContent | null;
  twitter_content: TwitterContent | null;

  changed_by: string; // 'user' | 'ai-regenerate'
  change_note: string | null;
  created_at: string;
}

export type LogLevel = 'info' | 'warn' | 'error';
export type LogStep =
  | 'ai_generate'
  | 'ai_retry'
  | 'render_linkedin'
  | 'render_instagram'
  | 'upload_storage'
  | 'db_save'
  | 'user_edit'
  | 'user_approve'
  | 'slide_regenerate';

export interface DistributionLog {
  id: string;
  distribution_id: string;
  step: LogStep;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── API request / response ───────────────────────────────────

export interface DistributeRequest {
  slug: string;
}

export interface DistributeResponse {
  id: string;
}

export interface RegenerateRequest {
  scope: 'all' | 'linkedin' | 'instagram' | 'twitter' | 'slide' | 'caption' | 'hashtags';
  platform?: 'linkedin' | 'instagram';
  slide_index?: number;
}

export interface UpdateDistributionRequest {
  linkedin_content?: LinkedInContent;
  instagram_content?: InstagramContent;
  twitter_content?: TwitterContent;
  status?: DistributionStatus;
}

// ── List / pagination ────────────────────────────────────────

export interface DistributionListItem {
  id: string;
  post_slug: string;
  post_title: string;
  status: DistributionStatus;
  linkedin_slides_count: number;
  instagram_slides_count: number;
  twitter_tweets_count: number;
  ai_metadata: AIMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface DistributionListResponse {
  items: DistributionListItem[];
  total: number;
  page: number;
  per_page: number;
}
