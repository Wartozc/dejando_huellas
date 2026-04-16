/**
 * Reaction on a message
 */
export interface Reaction {
  user_id: string;
  user_name: string;
  emoji: string;
}

/**
 * Message model representing a chat message
 * Matches backend domain/message.go
 */
export interface Message {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  reactions: Reaction[];
}

/**
 * Request DTOs
 */
export interface CreateMessageDto {
  content: string;
}

export interface UpdateMessageDto {
  content: string;
}

export interface ReactionDto {
  emoji: string;
}

/**
 * Backend response wrapper for messages
 */
export interface MessagesResponse {
  messages: Message[];
}

/**
 * Backend response wrapper for creating a message
 */
export interface MessageResponse {
  message: string;
  data: Message;
}

/**
 * Backend response for operations
 */
export interface OperationResponse {
  message: string;
  data?: Message;
}