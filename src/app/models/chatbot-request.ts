export interface ChatbotConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotRequest {
  message: string;
  conversationHistory?: ChatbotConversationMessage[];
}
