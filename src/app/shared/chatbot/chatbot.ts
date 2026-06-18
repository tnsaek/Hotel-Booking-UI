import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/chat-message';
import { ChatbotConversationMessage } from '../../models/chatbot-request';
import { ChatbotService } from '../../services/chatbot-service';

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class Chatbot {
  isOpen = false;
  isSending = false;
  draftMessage = '';
  errorMessage = '';
  messages: ChatMessage[] = [];
  private readonly historyLimit = 10;

  constructor(
    private chatbotService: ChatbotService,
    private changeDetector: ChangeDetectorRef
  ) {}

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    this.errorMessage = '';
  }

  sendMessage(): void {
    const message = this.draftMessage.trim();
    if (!message || this.isSending) {
      return;
    }

    const conversationHistory = this.conversationHistory();

    this.messages = [
      ...this.messages,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ];
    this.draftMessage = '';
    this.errorMessage = '';
    this.isSending = true;

    this.chatbotService.sendMessage(message, conversationHistory).subscribe({
      next: (response) => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
          },
        ];
        this.isSending = false;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to reach the hotel assistant. Please try again.';
        this.isSending = false;
        this.changeDetector.detectChanges();
      },
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearConversation(): void {
    this.messages = [];
    this.errorMessage = '';
    this.draftMessage = '';
  }

  private conversationHistory(): ChatbotConversationMessage[] {
    return this.messages
      .slice(-this.historyLimit)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
  }
}
