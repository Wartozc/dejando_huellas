import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HabeasData {
  id?: string;
  content: string;
  updated_at?: string;
}

export interface HabeasDataResponse {
  habeasData: HabeasData;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabeasDataService {
  private apiUrl = `${environment.apiUrl}/habeas-data`;

  constructor(private http: HttpClient) {}

  /**
   * Get habeas data (public)
   * Backend: GET /habeas-data
   * Response: { habeasData: HabeasData }
   */
  getHabeasData(): Observable<HabeasDataResponse> {
    return this.http.get<HabeasDataResponse>(this.apiUrl);
  }

  /**
   * Update habeas data (admin only)
   * Backend: PUT /habeas-data
   * Response: { message: string, habeasData: HabeasData }
   */
  updateHabeasData(content: string): Observable<HabeasDataResponse> {
    return this.http.put<HabeasDataResponse>(this.apiUrl, { content });
  }
}