import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post, PostCreateDto, PostUpdateDto, PostsResponse, PostResponse } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PublicationsService {
  private apiUrl = `${environment.apiUrl}/posts`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

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
  createPost(data: PostCreateDto): Observable<PostResponse> {
    const user = this.authService.user();
    const body = {
      ...data,
      author_id: user?.id,
      author_name: user?.name
    };
    return this.http.post<PostResponse>(this.apiUrl, body);
  }

  /**
   * Update a post (Admin only)
   * Backend: PUT /posts/:id
   * Response: { message: string, post: Post }
   */
  updatePost(id: string, data: PostUpdateDto): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, data);
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
    images: File[]
  ): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    images.forEach((image) => {
      formData.append('images', image);
    });
    return this.http.post<PostResponse>(`${this.apiUrl}/with-images`, formData);
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
    images: File[]
  ): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    images.forEach((image) => {
      formData.append('images', image);
    });
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}/with-images`, formData);
  }
}
