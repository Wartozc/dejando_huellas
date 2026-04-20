export interface ChatBotOption {
  id: string;
  question: string;
  answer: string;
  parent_id?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  children?: ChatBotTreeNode[];
}

export interface ChatBotTreeNode extends ChatBotOption {
  children: ChatBotTreeNode[];
}

export interface CreateChatBotRequest {
  question: string;
  answer: string;
  parent_id?: string | null;
  order: number;
}

export interface UpdateChatBotRequest {
  question?: string;
  answer?: string;
  parent_id?: string | null;
  order?: number;
}

export interface ChatBotResponse {
  options: ChatBotTreeNode[];
}

export interface SingleChatBotResponse {
  option: ChatBotOption;
}

export interface ChatBotMessageResponse {
  message: string;
  option: ChatBotOption;
}