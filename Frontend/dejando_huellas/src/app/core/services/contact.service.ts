import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactCreateDto, ContactMessage, ContactsResponse, ContactResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  /**
   * Send a contact message (public)
   * Backend: POST /contact
   * Response: { message: string, contact: ContactMessage }
   */
  sendMessage(data: ContactCreateDto): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(this.apiUrl, data);
  }

  /**
   * Get all messages (Admin only)
   * Backend: GET /contact
   * Response: { contacts: ContactMessage[] }
   */
  getAllMessages(): Observable<ContactsResponse> {
    return this.http.get<ContactsResponse>(this.apiUrl);
  }
}
