import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments';
import { ChatbotConversationMessage, ChatbotRequest } from '../models/chatbot-request';
import { ChatbotResponse } from '../models/chatbot-response';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private api = `${environment.apiUrl}/chatbot/message`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, conversationHistory: ChatbotConversationMessage[] = []): Observable<ChatbotResponse> {
    const request: ChatbotRequest = { message, conversationHistory };
    return this.http.post<ChatbotResponse>(this.api, request);
  }
}
