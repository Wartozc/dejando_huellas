import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatBotOption,
  ChatBotTreeNode,
  CreateChatBotRequest,
  UpdateChatBotRequest,
  ChatBotResponse,
  SingleChatBotResponse,
  ChatBotMessageResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;

  constructor(private http: HttpClient) {}

  /**
   * Get all chatbot options as a tree structure (public)
   * Backend: GET /chatbot
   * Response: { options: ChatBotTreeNode[] }
   */
  getAllOptions(): Observable<ChatBotResponse> {
    return this.http.get<ChatBotResponse>(this.apiUrl);
  }

  /**
   * Get chatbot option by ID (public)
   * Backend: GET /chatbot/:id
   * Response: { option: ChatBotOption }
   */
  getOptionById(id: string): Observable<SingleChatBotResponse> {
    return this.http.get<SingleChatBotResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new chatbot option (Admin only)
   * Backend: POST /chatbot
   * Response: { message: string, option: ChatBotOption }
   */
  createOption(data: CreateChatBotRequest): Observable<ChatBotMessageResponse> {
    return this.http.post<ChatBotMessageResponse>(this.apiUrl, data);
  }

  /**
   * Update a chatbot option (Admin only)
   * Backend: PUT /chatbot/:id
   * Response: { message: string, option: ChatBotOption }
   */
  updateOption(id: string, data: UpdateChatBotRequest): Observable<ChatBotMessageResponse> {
    return this.http.put<ChatBotMessageResponse>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a chatbot option (Admin only)
   * Backend: DELETE /chatbot/:id
   * Response: { message: string }
   */
  deleteOption(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}