// Reddit API Types

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  accessToken?: string;
  refreshToken?: string;
  callbackUrl: string;
}

export interface RedditOAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface RedditUser {
  id: string;
  name: string;
  fullname: string;
  created: number;
  created_utc: number;
  karma_link: number;
  karma_comment: number;
  karma_total: number;
  has_verified_email: boolean;
  inbox_count?: number;
  gold_creddits: number;
  is_gold: boolean;
  is_mod: boolean;
  has_mail: boolean;
  has_mod_mail: boolean;
  over_18: boolean;
  is_employee: boolean;
  is_suspended: boolean;
  awarder_karma: number;
  awardee_karma: number;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  subreddits?: RedditSubreddit[];
}

export interface RedditSubreddit {
  id: string;
  name: string;
  display_name: string;
  title: string;
  url: string;
  created: number;
  created_utc: number;
  subscriber_count: number;
  over18: boolean;
  public_description: string;
  description: string;
  sidebar_html?: string;
  header_img?: string;
  icon_img?: string;
  banner_img?: string;
  community_rules?: string[];
  is_default: boolean;
  is_gold_only: boolean;
  is_over_18: boolean;
  is_private: boolean;
  is_quarantined: boolean;
  submission_type: 'any' | 'link' | 'self';
  submission_flair_options?: RedditFlair[];
}

export interface RedditFlair {
  id: string;
  text: string;
  type: 'text' | 'richtext';
  background_color?: string;
  text_color?: string;
  css_class?: string;
  editable: boolean;
}

export interface RedditPost {
  id: string;
  name: string;
  title: string;
  body?: string;
  selftext?: string;
  url?: string;
  permalink: string;
  link_permalink?: string;
  created: number;
  created_utc: number;
  author: RedditUser;
  subreddit: RedditSubreddit;
  subreddit_name_prefixed: string;
  num_comments: number;
  score: number;
  upvote_ratio: number;
  ups: number;
  downs: number;
  over_18: boolean;
  spoiler: boolean;
  locked: boolean;
  archived: boolean;
  pinned: boolean;
  is_self: boolean;
  is_video: boolean;
  media?: RedditMedia;
  preview?: RedditPreview;
  link_flair_text?: string;
  link_flair_type?: string;
  author_flair_text?: string;
  author_flair_type?: string;
  domain: string;
  approved_at_utc?: number;
  banned_at_utc?: number;
  mod_note?: string;
  removed_by?: string;
  banned_by?: string;
  user_removed?: boolean;
  mod_removed?: boolean;
  category?: string;
  likes?: boolean | null;
  saved?: boolean;
  gilded: number;
  clicked?: boolean;
  hidden?: boolean;
  view_count?: number;
  visited?: boolean;
  content_categories?: string[];
  suggested_sort?: string;
  thumbnail?: string;
}

export interface RedditMedia {
  type?: string;
  oembed?: {
    title?: string;
    provider_url?: string;
    description?: string;
    url?: string;
    author_name?: string;
    height?: number;
    width?: number;
    html?: string;
    thumbnail_width?: number;
    thumbnail_height?: number;
    thumbnail_url?: string;
    provider_name?: string;
    version?: string;
  };
  reddit_video?: {
    fallback_url: string;
    dash_url: string;
    hls_url: string;
    is_gif: boolean;
    scrubber_media_url: string;
    dash_manifest_url: string;
    hls_manifest_url: string;
    duration: number;
    height: number;
    width: number;
  };
}

export interface RedditPreview {
  enabled: boolean;
  images?: Array<{
    id: string;
    source: {
      url: string;
      width: number;
      height: number;
    };
    resolutions: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    variants: Record<string, unknown>;
  }>;
  reddit_video_preview?: {
    fallback_url: string;
    dash_url?: string;
    hls_url?: string;
    is_gif: boolean;
    scrubber_media_url: string;
    duration: number;
    height: number;
    width: number;
  };
  enabled: boolean;
}

export interface RedditComment {
  id: string;
  name: string;
  link_id: string;
  parent_id: string;
  body: string;
  body_html?: string;
  created: number;
  created_utc: number;
  author: RedditUser;
  subreddit: RedditSubreddit;
  subreddit_name_prefixed: string;
  link_title: string;
  link_author: string;
  link_permalink: string;
  ups: number;
  downs: number;
  score: number;
  score_hidden: boolean;
  archived: boolean;
  is_root: boolean;
  is_submitter: boolean;
  pinned: boolean;
  stickied: boolean;
  collapsed: boolean;
  removed: boolean;
  deleted: boolean;
  approved: boolean;
  spam: boolean;
  mod_note?: string;
  author_flair_text?: string;
  link_flair_text?: string;
  num_reports?: number;
  report_reasons?: string[];
  depth: number;
  children?: string[];
  replies?: RedditComment[];
}

export interface RedditMessage {
  id: string;
  name: string;
  subject: string;
  body: string;
  body_html?: string;
  created: number;
  created_utc: number;
  author: RedditUser;
  dest: string;
  subreddit?: string;
  new: boolean;
  read: boolean;
  was_comment: boolean;
  parent_id?: string;
  replies?: RedditMessage[];
}

export interface RedditKarma {
  sr: string;
  comment_karma: number;
  link_karma: number;
  awarder_karma: number;
  awardee_karma: number;
  total_karma: number;
}

export interface CreatePostRequest {
  subreddit: string;
  title: string;
  text?: string;
  url?: string;
  flair_id?: string;
  flair_text?: string;
  resubmit?: boolean;
  send_replies?: boolean;
  nsfw?: boolean;
  spoiler?: boolean;
  collection_id?: string;
}

export interface CreateCommentRequest {
  text: string;
  parent: string; // Either post ID or comment ID
  subreddit: string;
  thing_id?: string; // Fullname of parent (t3_ for posts, t1_ for comments)
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
