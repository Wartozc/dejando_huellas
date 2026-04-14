import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserCreateDto, UserUpdateDto, UsersResponse, UserResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  /**
   * Get all members (Admin only)
   * Backend: GET /members
   * Response: { users: User[] }
   */
  getAllMembers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(this.apiUrl);
  }

  /**
   * Get member by ID
   * Backend: GET /members/:id
   * Response: { user: User }
   */
  getMemberById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Register a new member
   * Backend: POST /members/register
   * Response: { message: string, user: User }
   */
  registerMember(data: UserCreateDto): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, data);
  }

  /**
   * Update a member
   * Backend: PUT /members/:id
   * Response: { user: User }
   */
  updateMember(id: string, data: UserUpdateDto): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a member
   * Backend: DELETE /members/:id
   * Response: { message: string }
   */
  deleteMember(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Approve a member
   * Backend: POST /members/:id/approve
   * Response: { message: string, user: User }
   */
  approveMember(id: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * Reject a member
   * Backend: POST /members/:id/reject
   * Response: { message: string, user: User }
   */
  rejectMember(id: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${id}/reject`, {});
  }
}
