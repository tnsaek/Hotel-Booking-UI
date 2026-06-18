import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ChatbotService } from '../../services/chatbot-service';
import { Chatbot } from './chatbot';

describe('Chatbot', () => {
  let component: Chatbot;
  let fixture: ComponentFixture<Chatbot>;
  let chatbotServiceSpy: {
    sendMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    chatbotServiceSpy = {
      sendMessage: vi.fn().mockReturnValue(of({ response: 'Verified room 101 is available.' })),
    };

    await TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [
        { provide: ChatbotService, useValue: chatbotServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function openPanel(): void {
    component.isOpen = true;
    fixture.detectChanges();
  }

  function textarea(): HTMLTextAreaElement {
    const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('#chatbot-message');
    if (!element) {
      throw new Error('Expected chatbot textarea to exist');
    }
    return element;
  }

  function composerButtons(): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.composer-actions button')
    );
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close the assistant panel', () => {
    fixture.detectChanges();
    expect(textContent()).not.toContain('Hotel Assistant');

    const launcher = fixture.nativeElement.querySelector('.chatbot-launcher') as HTMLButtonElement;
    launcher.click();
    fixture.detectChanges();
    expect(textContent()).toContain('Hotel Assistant');

    const closeButton = fixture.nativeElement.querySelector('.icon-button') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();
    expect(textContent()).not.toContain('Hotel Assistant');
  });

  it('should send a user message and append the assistant response', () => {
    component.isOpen = true;
    component.draftMessage = ' Is room 101 available? ';

    component.sendMessage();
    fixture.detectChanges();

    expect(chatbotServiceSpy.sendMessage).toHaveBeenCalledWith('Is room 101 available?', []);
    expect(component.messages.map((message) => message.content)).toEqual([
      'Is room 101 available?',
      'Verified room 101 is available.',
    ]);
    expect(component.draftMessage).toBe('');
    expect(component.isSending).toBe(false);
    expect(textContent()).toContain('Verified room 101 is available.');
  });

  it('should not send blank messages', () => {
    component.draftMessage = '   ';

    component.sendMessage();

    expect(chatbotServiceSpy.sendMessage).not.toHaveBeenCalled();
    expect(component.messages).toEqual([]);
  });

  it('should show backend error messages', () => {
    chatbotServiceSpy.sendMessage.mockReturnValue(throwError(() => ({ error: { message: 'Gemini API key is not configured' } })));
    component.isOpen = true;
    component.draftMessage = 'Help';

    component.sendMessage();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Gemini API key is not configured');
    expect(component.isSending).toBe(false);
    expect(textContent()).toContain('Gemini API key is not configured');
  });

  it('should show a fallback backend error message', () => {
    chatbotServiceSpy.sendMessage.mockReturnValue(throwError(() => ({})));
    component.isOpen = true;
    component.draftMessage = 'Help';

    component.sendMessage();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Unable to reach the hotel assistant. Please try again.');
    expect(component.isSending).toBe(false);
    expect(textContent()).toContain('Unable to reach the hotel assistant. Please try again.');
  });

  it('should render the loading assistant message while a request is pending', () => {
    const response$ = new Subject<{ response: string }>();
    chatbotServiceSpy.sendMessage.mockReturnValue(response$);
    component.isOpen = true;
    component.draftMessage = 'Check availability';

    component.sendMessage();
    fixture.detectChanges();

    expect(component.isSending).toBe(true);
    expect(textContent()).toContain('Checking verified hotel information...');

    response$.next({ response: 'Room 101 is available.' });
    response$.complete();
    fixture.detectChanges();
    expect(textContent()).toContain('Room 101 is available.');
  });

  it('should send on Enter without Shift', () => {
    component.draftMessage = 'Pricing';
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    component.onComposerKeydown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(chatbotServiceSpy.sendMessage).toHaveBeenCalledWith('Pricing', []);
  });

  it('should send from the template textarea Enter key binding', () => {
    component.isOpen = true;
    component.draftMessage = 'Pricing';
    fixture.detectChanges();
    const input = textarea();

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    input.dispatchEvent(event);
    fixture.detectChanges();

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(chatbotServiceSpy.sendMessage).toHaveBeenCalledWith('Pricing', []);
    expect(textContent()).toContain('Verified room 101 is available.');
  });

  it('should send from the template composer submit binding', () => {
    component.isOpen = true;
    component.draftMessage = 'Availability';
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>('.chatbot-composer');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(chatbotServiceSpy.sendMessage).toHaveBeenCalledWith('Availability', []);
    expect(textContent()).toContain('Verified room 101 is available.');
  });

  it('should not send on Shift Enter', () => {
    component.draftMessage = 'Pricing';
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    component.onComposerKeydown(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(chatbotServiceSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should not send on non-Enter keys', () => {
    component.draftMessage = 'Pricing';
    const event = new KeyboardEvent('keydown', { key: 'A' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    component.onComposerKeydown(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(chatbotServiceSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should send recent conversation history with follow-up messages', () => {
    component.messages = [
      { role: 'user', content: 'I need cheap hotels in Charlotte, North Carolina', timestamp: new Date() },
      { role: 'assistant', content: 'Please provide dates and guests.', timestamp: new Date() },
    ];
    component.draftMessage = 'I need a room for Sunday for one guest';

    component.sendMessage();

    expect(chatbotServiceSpy.sendMessage).toHaveBeenCalledWith(
      'I need a room for Sunday for one guest',
      [
        { role: 'user', content: 'I need cheap hotels in Charlotte, North Carolina' },
        { role: 'assistant', content: 'Please provide dates and guests.' },
      ]
    );
  });

  it('should clear conversation state', () => {
    component.messages = [
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'assistant', content: 'Hi', timestamp: new Date() },
    ];
    component.errorMessage = 'Previous error';
    component.draftMessage = 'Draft';

    component.clearConversation();

    expect(component.messages).toEqual([]);
    expect(component.errorMessage).toBe('');
    expect(component.draftMessage).toBe('');
  });

  it('should clear conversation from the template clear button', () => {
    component.isOpen = true;
    component.messages = [
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'assistant', content: 'Hi', timestamp: new Date() },
    ];
    component.errorMessage = 'Previous error';
    component.draftMessage = 'Draft';
    fixture.detectChanges();

    composerButtons()[0].click();
    fixture.detectChanges();

    expect(component.messages).toEqual([]);
    expect(component.errorMessage).toBe('');
    expect(component.draftMessage).toBe('');
    expect(textContent()).toContain('How can I help?');
  });

  it('should disable only the send button when the draft is empty', () => {
    component.isOpen = true;
    component.messages = [{ role: 'user', content: 'Hello', timestamp: new Date() }];
    component.draftMessage = '';
    component.isSending = false;
    fixture.detectChanges();

    const buttons = composerButtons();
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
  });

  it('should disable composer controls while sending', () => {
    component.isOpen = true;
    component.messages = [{ role: 'user', content: 'Hello', timestamp: new Date() }];
    component.draftMessage = 'Help';
    component.isSending = true;
    fixture.detectChanges();

    const buttons = composerButtons();
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
