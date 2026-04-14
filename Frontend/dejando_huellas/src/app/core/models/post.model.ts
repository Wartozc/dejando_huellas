/**
 * Post model representing publications/activities/blog posts
 * Matches backend domain/post.go
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string[];
  created_by?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  // Optional alias for creator name for easier access in templates
  author_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface PostCreateDto {
  title: string;
  content: string;
  image_url?: string[];
}

export interface PostUpdateDto {
  title?: string;
  content?: string;
  image_url?: string[];
}

/**
 * Backend response wrapper for posts list
 */
export interface PostsResponse {
  posts: Post[];
}

/**
 * Backend response wrapper for single post
 */
export interface PostResponse {
  post: Post;
  message?: string;
  image_url?: string[];
  image_count?: number;
}
