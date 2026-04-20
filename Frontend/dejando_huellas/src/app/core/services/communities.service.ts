import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Community } from '../models';

export interface CommunitiesResponse {
  communities: Community[];
}

export interface CommunityResponse {
  community: Community;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommunitiesService {
  private apiUrl = `${environment.apiUrl}/communities`;

  constructor(private http: HttpClient) {}

  /**
   * Get all communities (any authenticated)
   * Backend: GET /communities
   * Response: { communities: Community[] }
   */
  getAllCommunities(): Observable<CommunitiesResponse> {
    return this.http.get<CommunitiesResponse>(this.apiUrl);
  }

  /**
   * Get community by ID
   * Backend: GET /communities/:id
   * Response: { community: Community }
   */
  getCommunityById(id: string): Observable<CommunityResponse> {
    return this.http.get<CommunityResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new community (admin only)
   * Backend: POST /communities
   * Response: { message: string, community: Community }
   */
  createCommunity(name: string): Observable<CommunityResponse> {
    return this.http.post<CommunityResponse>(this.apiUrl, { name });
  }

  /**
   * Update a community (admin only)
   * Backend: PUT /communities/:id
   * Response: { message: string, community: Community }
   */
  updateCommunity(id: string, name: string): Observable<CommunityResponse> {
    return this.http.put<CommunityResponse>(`${this.apiUrl}/${id}`, { name });
  }

  /**
   * Delete a community (admin only)
   * Backend: DELETE /communities/:id
   * Response: { message: string }
   */
  deleteCommunity(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}