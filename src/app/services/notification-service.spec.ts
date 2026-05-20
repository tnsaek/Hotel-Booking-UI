import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { AppNotification } from '../models/notification';
import { NotificationService } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const notification: AppNotification = {
    id: 3,
    type: 'BOOKING_CONFIRMED',
    message: 'Confirmed',
    read: false,
    createdAt: '2026-05-14T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get user notifications and unread count', () => {
    service.getUserNotifications(7).subscribe((response) => expect(response).toEqual([notification]));
    let request = httpMock.expectOne(`${environment.apiUrl}/notifications/user/7`);
    expect(request.request.method).toBe('GET');
    request.flush([notification]);

    service.getUnreadCount(7).subscribe((response) => expect(response).toEqual({ count: 2 }));
    request = httpMock.expectOne(`${environment.apiUrl}/notifications/user/7/unread-count`);
    expect(request.request.method).toBe('GET');
    request.flush({ count: 2 });
  });

  it('should mark notifications as read', () => {
    service.markAsRead(3).subscribe((response) => expect(response).toEqual({ ...notification, read: true }));
    let request = httpMock.expectOne(`${environment.apiUrl}/notifications/3/read`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBeNull();
    request.flush({ ...notification, read: true });

    service.markAllAsRead(7).subscribe((response) => expect(response).toBeNull());
    request = httpMock.expectOne(`${environment.apiUrl}/notifications/user/7/read-all`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBeNull();
    request.flush(null);
  });

  it('should emit notification refresh requests', () => {
    const refreshSpy = vi.fn();
    const subscription = service.refreshNotifications$.subscribe(refreshSpy);

    service.requestNotificationsRefresh();

    expect(refreshSpy).toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
