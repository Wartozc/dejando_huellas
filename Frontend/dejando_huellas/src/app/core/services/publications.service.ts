import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap, catchError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post, PostCreateDto, PostUpdateDto, PostsResponse, PostResponse, Community } from '../models';
import { AuthService } from './auth.service';
import { CommunitiesService } from './communities.service';

const CACHED_COMMUNITIES_KEY = 'dh_cached_communities';

@Injectable({
  providedIn: 'root'
})
export class PublicationsService {
  private apiUrl = `${environment.apiUrl}/posts`;
  private authService = inject(AuthService);
  private communitiesService = inject(CommunitiesService);
  
  // Cache for communities to resolve IDs to names
  private communitiesCache: Community[] | null = null;

  constructor(private http: HttpClient) {
    this.loadCommunitiesCache();
  }

  /**
   * Load communities into cache from localStorage or API
   */
  private loadCommunitiesCache(): void {
    const cached = localStorage.getItem(CACHED_COMMUNITIES_KEY);
    if (cached) {
      try {
        this.communitiesCache = JSON.parse(cached);
      } catch {
        this.communitiesCache = null;
      }
    }
  }

  /**
   * Save communities to localStorage cache
   */
  private saveCommunitiesCache(communities: Community[]): void {
    this.communitiesCache = communities;
    localStorage.setItem(CACHED_COMMUNITIES_KEY, JSON.stringify(communities));
  }

  /**
   * Resolve community ID to community name
   * If community is already a name (not an ID), return it as is
   * If community looks like an ID, look up the name from cache or API
   */
  private resolveCommunityName(communityValue: string | undefined): Observable<string> {
    if (!communityValue) {
      return of('');
    }

    // Check if it looks like a MongoDB ID (24 hex characters)
    const isMongoId = /^[a-f0-9]{24}$/i.test(communityValue);

    if (!isMongoId) {
      // Already a name, return as is
      return of(communityValue);
    }

    // It's an ID - look up the name
    // First try cache
    if (this.communitiesCache) {
      const found = this.communitiesCache.find(c => c.id === communityValue);
      if (found) {
        return of(found.name);
      }
    }

    // Fetch from API and cache
    return this.communitiesService.getAllCommunities().pipe(
      tap(response => this.saveCommunitiesCache(response.communities)),
      map(response => {
        const community = response.communities.find(c => c.id === communityValue);
        return community?.name || communityValue; // Return name or original ID if not found
      }),
      catchError(() => of(communityValue)) // Return original if API fails
    );
  }

  /**
   * Resolve community synchronously (uses cached value only)
   * For use in places where Observable is not convenient
   */
  resolveCommunityNameSync(communityValue: string | undefined): string {
    if (!communityValue) {
      return '';
    }

    // Check if it looks like a MongoDB ID (24 hex characters)
    const isMongoId = /^[a-f0-9]{24}$/i.test(communityValue);

    if (!isMongoId) {
      // Already a name, return as is
      return communityValue;
    }

    // Try to find in cache
    if (this.communitiesCache) {
      const found = this.communitiesCache.find(c => c.id === communityValue);
      if (found) {
        return found.name;
      }
    }

    return communityValue; // Return as-is if not found in cache
  }

  /**
   * Get all posts (public)
   * Backend: GET /posts
   * Response: { posts: Post[] }
   */
  getAllPosts(): Observable<PostsResponse> {
    return this.http.get<PostsResponse>(this.apiUrl);
  }

  /**
   * Get post by ID
   * Backend: GET /posts/:id
   * Response: { post: Post }
   */
  getPostById(id: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
  }

/**
   * Create a new post (Authenticated users - members and admin)
   * Backend: POST /posts
   * Response: { message: string, post: Post }
   */
  createPost(data: PostCreateDto, community?: string): Observable<PostResponse> {
    const user = this.authService.user();
    // Use provided community, or get from user's community if available
    const userCommunityValue = community || user?.community || '';
    
    // Resolve community name (ID -> name or keep as name)
    return this.resolveCommunityName(userCommunityValue).pipe(
      switchMap(postCommunity => {
        const body = {
          ...data,
          author_id: user?.id,
          author_name: user?.name,
          community: postCommunity
        };
        return this.http.post<PostResponse>(this.apiUrl, body);
      })
    );
  }

/**
    * Update a post (Admin only)
    * Backend: PUT /posts/:id
    * Response: { message: string, post: Post }
    */
  updatePost(id: string, data: PostUpdateDto, community?: string): Observable<PostResponse> {
    const body = {
      ...data,
      community: community || ''
    };
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Delete a post (Admin only)
   * Backend: DELETE /posts/:id
   * Response: { message: string }
   */
  deletePost(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

/**
      * Create a post with images (Authenticated users - members and admin)
      * Backend: POST /posts/with-images
      * Uses multipart/form-data for file uploads
      * Response: { message: string, post: Post }
      */
  createPostWithImages(
    title: string,
    content: string,
    images: File[],
    community?: string
  ): Observable<PostResponse> {
    const user = this.authService.user();
    // Use provided community, or get from user's community if available
    const userCommunityValue = community || user?.community || '';
    
    // Resolve community name (ID -> name or keep as name)
    return this.resolveCommunityName(userCommunityValue).pipe(
      switchMap(resolvedCommunity => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('community', resolvedCommunity);
        images.forEach((image) => {
          formData.append('images', image);
        });
        return this.http.post<PostResponse>(`${this.apiUrl}/with-images`, formData);
      })
    );
  }

  /**
   * Update a post with images (Admin only)
   * Backend: PUT /posts/:id/with-images
   * Uses multipart/form-data for file uploads
   * Response: { message: string, post: Post }
   */
  updatePostWithImages(
    id: string,
    title: string,
    content: string,
    images: File[],
    community?: string
  ): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (community) {
      formData.append('community', community);
    }
    images.forEach((image) => {
      formData.append('images', image);
    });
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}/with-images`, formData);
  }
}
