import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

import { PaymentFailure } from './payment-failure';

describe('PaymentFailure', () => {
  let component: PaymentFailure;
  let fixture: ComponentFixture<PaymentFailure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFailure],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFailure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the payment failure message and possible reasons', () => {
    const pageText = textContent();

    expect(pageText).toContain('Payment Failed');
    expect(pageText).toContain("We're sorry, but your payment could not be processed at this time.");
    expect(pageText).toContain('Possible reasons:');
    expect(pageText).toContain('Insufficient funds');
    expect(pageText).toContain('Invalid card details');
    expect(pageText).toContain('Card expired');
    expect(pageText).toContain('Technical issue');
  });

  it('should render booking and retry actions with router links', () => {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.actions button')
    );
    const routerLinkElements = fixture.debugElement.queryAll(By.directive(RouterLink));

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('View My Bookings');
    expect(buttons[0].classList).toContain('btn-secondary');
    expect(buttons[1].textContent?.trim()).toBe('Try Again');
    expect(buttons[1].classList).toContain('btn-primary');
    expect(routerLinkElements.length).toBe(2);
    expect(routerLinkElements.map((element) => element.attributes['routerLink'])).toEqual([
      '/my-bookings',
      '/search',
    ]);
  });
});
