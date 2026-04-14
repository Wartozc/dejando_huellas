/**
 * Contact message model
 * Matches backend domain/contact.go
 */
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}

export interface ContactCreateDto {
  name: string;
  email: string;
  message: string;
}

/**
 * Backend response wrapper for contacts list
 */
export interface ContactsResponse {
  contacts: ContactMessage[];
}

/**
 * Backend response wrapper for single contact
 */
export interface ContactResponse {
  contact: ContactMessage;
  message?: string;
}
