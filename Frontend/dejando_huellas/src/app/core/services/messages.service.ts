import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message, MessagesResponse, MessageResponse, CreateMessageDto, UpdateMessageDto, ReactionDto, OperationResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = environment.apiUrl;
  
  // Signal-based state
  private _messages = signal<Message[]>([]);
  private _isLoading = signal<boolean>(false);
  private _lastUpdateTime = signal<string>('');

  // Public computed signals
  readonly messages = this._messages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastUpdateTime = this._lastUpdateTime.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get all messages from the group chat
   * Backend: GET /messages
   * Response: { messages: Message[] }
   */
  getMessages(): Observable<MessagesResponse> {
    this._isLoading.set(true);
    return this.http.get<MessagesResponse>(`${this.apiUrl}/messages`).pipe(
      tap(response => {
        if (response.messages && response.messages.length > 0) {
          this._messages.set(response.messages);
          // Update last update time to latest message timestamp
          const lastMessage = response.messages[response.messages.length - 1];
          this._lastUpdateTime.set(lastMessage.created_at);
        }
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        this._messages.set([]);
        return of({ messages: [] });
      }),
      finalize(() => {
        this._isLoading.set(false);
      })
    );
  }

  /**
   * Get new messages since a specific timestamp
   * Backend: GET /messages/since?since={timestamp}
   * Response: { messages: Message[] }
   */
  getMessagesSince(since: string): Observable<MessagesResponse> {
    const params = new HttpParams().set('since', since);
    
    return this.http.get<MessagesResponse>(`${this.apiUrl}/messages/since`, { params }).pipe(
      tap(response => {
        if (response.messages && response.messages.length > 0) {
          // Append new messages to existing ones, filtering out duplicates
          this._messages.update(current => {
            const existingIds = new Set(current.map(msg => msg.id));
            const newMessages = response.messages.filter(msg => !existingIds.has(msg.id));
            if (newMessages.length === 0) return current;
            return [...current, ...newMessages];
          });
          // Update last update time
          const lastMessage = response.messages[response.messages.length - 1];
          this._lastUpdateTime.set(lastMessage.created_at);
        }
      }),
      catchError(error => {
        console.error('Error fetching new messages:', error);
        return of({ messages: [] });
      })
    );
  }

  /**
   * Create a new message
   * Backend: POST /messages
   * Response: { message: string, data: Message }
   */
  createMessage(content: string): Observable<MessageResponse> {
    const dto: CreateMessageDto = { content };
    
    return this.http.post<MessageResponse>(`${this.apiUrl}/messages`, dto).pipe(
      tap(response => {
        if (response.data) {
          // Add the new message to the list
          this._messages.update(current => [...current, response.data]);
          this._lastUpdateTime.set(response.data.created_at);
        }
      }),
      catchError(error => {
        console.error('Error creating message:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing message
   * Backend: PUT /messages/:id
   * Response: { message: string, data: Message }
   */
  updateMessage(messageId: string, content: string): Observable<OperationResponse> {
    const dto: UpdateMessageDto = { content };
    
    return this.http.put<OperationResponse>(`${this.apiUrl}/messages/${messageId}`, dto).pipe(
      tap(response => {
        if (response.data) {
          // Update the message in the list
          this._messages.update(current => 
            current.map(msg => msg.id === messageId ? response.data! : msg)
          );
        }
      }),
      catchError(error => {
        console.error('Error updating message:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a message
   * Backend: DELETE /messages/:id
   * Response: { message: string }
   */
  deleteMessage(messageId: string): Observable<OperationResponse> {
    return this.http.delete<OperationResponse>(`${this.apiUrl}/messages/${messageId}`).pipe(
      tap(() => {
        // Remove the message from the list
        this._messages.update(current => 
          current.filter(msg => msg.id !== messageId)
        );
      }),
      catchError(error => {
        console.error('Error deleting message:', error);
        throw error;
      })
    );
  }

  /**
   * Add or toggle a reaction on a message
   * Backend: POST /messages/:id/reactions
   * Response: { message: string }
   */
  addReaction(messageId: string, emoji: string): Observable<OperationResponse> {
    const dto: ReactionDto = { emoji };
    
    return this.http.post<OperationResponse>(`${this.apiUrl}/messages/${messageId}/reactions`, dto).pipe(
      tap(() => {
        // Refetch messages to get updated reactions
        this.getMessages().subscribe();
      }),
      catchError(error => {
        console.error('Error adding reaction:', error);
        throw error;
      })
    );
  }

  /**
   * Clear messages (e.g., on logout)
   */
  clearMessages(): void {
    this._messages.set([]);
    this._lastUpdateTime.set('');
  }

  /**
   * Clear all messages (Admin only)
   * Backend: DELETE /messages
   * Response: { message: string }
   */
  clearAllMessages(): Observable<OperationResponse> {
    return this.http.delete<OperationResponse>(`${this.apiUrl}/messages`).pipe(
      tap(() => {
        this._messages.set([]);
        this._lastUpdateTime.set('');
      }),
      catchError(error => {
        console.error('Error clearing all messages:', error);
        throw error;
      })
    );
  }
}