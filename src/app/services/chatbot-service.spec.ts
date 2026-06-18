import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { ChatbotService } from './chatbot-service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChatbotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a chatbot message with conversation history', () => {
    const conversationHistory = [
      { role: 'user' as const, content: 'I need cheap hotels in Charlotte, North Carolina' },
      { role: 'assistant' as const, content: 'Please provide dates and guests.' },
    ];

    service.sendMessage('I need a room for Sunday for one guest', conversationHistory).subscribe((response) => {
      expect(response).toEqual({ response: 'Here are the verified available rooms.' });
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/chatbot/message`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      message: 'I need a room for Sunday for one guest',
      conversationHistory,
    });
    request.flush({ response: 'Here are the verified available rooms.' });
  });
});
