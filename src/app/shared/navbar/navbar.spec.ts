import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { AppNotification } from '../../models/notification';
import { AuthService } from '../../services/auth-service';
import { BookingService } from '../../services/booking-service';
import { NotificationService } from '../../services/notification-service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authUser$: BehaviorSubject<unknown>;
  let refreshNotifications$: Subject<void>;
  let authServiceSpy: {
    currentUser$: BehaviorSubject<unknown>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let bookingServiceSpy: {
    requestBookingsRefresh: ReturnType<typeof vi.fn>;
  };
  let notificationServiceSpy: {
    refreshNotifications$: Subject<void>;
    getUserNotifications: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };

  const unreadNotification: AppNotification = {
    id: 1,
    type: 'BOOKING_CONFIRMED',
    message: 'Booking confirmed',
    read: false,
    createdAt: '2026-05-14T10:00:00Z',
  };

  const readNotification: AppNotification = {
    id: 2,
    type: 'PAYMENT_RECEIVED',
    body: 'Payment body',
    read: true,
    createdAt: '2026-05-14T11:00:00Z',
  };

  beforeEach(async () => {
    authUser$ = new BehaviorSubject<unknown>(null);
    refreshNotifications$ = new Subject<void>();
    authServiceSpy = {
      currentUser$: authUser$,
      getCurrentUser: vi.fn().mockReturnValue(null),
      isAuthenticated: vi.fn().mockReturnValue(false),
      isAdmin: vi.fn().mockReturnValue(false),
      logout: vi.fn(),
    };
    bookingServiceSpy = {
      requestBookingsRefresh: vi.fn(),
    };
    notificationServiceSpy = {
      refreshNotifications$: refreshNotifications$,
      getUserNotifications: vi.fn().mockReturnValue(of([])),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    };
    routerSpy = {
      url: '/',
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render guest navigation links', () => {
    fixture.detectChanges();

    const pageText = textContent();
    expect(pageText).toContain('Hotel Booking');
    expect(pageText).toContain('Home');
    expect(pageText).toContain('Search');
    expect(pageText).toContain('All Hotels');
    expect(pageText).toContain('My Bookings');
    expect(pageText).toContain('Login');
    expect(pageText).not.toContain('Logout');
    expect(pageText).not.toContain('Manage Hotels');
  });

  it('should load notifications for authenticated users and prune stale expanded ids', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    notificationServiceSpy.getUserNotifications.mockReturnValue(of([unreadNotification, readNotification]));
    component.expandedNotificationIds.add(1);
    component.expandedNotificationIds.add(99);

    fixture.detectChanges();

    expect(notificationServiceSpy.getUserNotifications).toHaveBeenCalledWith(7);
    expect(component.notifications).toEqual([unreadNotification, readNotification]);
    expect(component.unreadCount).toBe(1);
    expect(component.expandedNotificationIds.has(1)).toBe(true);
    expect(component.expandedNotificationIds.has(99)).toBe(false);
  });

  it('should clear notifications when user is unauthenticated or loading fails', () => {
    component.notifications = [unreadNotification];
    component.unreadCount = 1;
    component.expandedNotificationIds.add(1);

    fixture.detectChanges();

    expect(component.notifications).toEqual([]);
    expect(component.unreadCount).toBe(0);
    expect(component.expandedNotificationIds.size).toBe(0);

    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    notificationServiceSpy.getUserNotifications.mockReturnValue(throwError(() => ({})));
    component.notifications = [unreadNotification];
    component.unreadCount = 1;
    component.expandedNotificationIds.add(1);

    component.ngOnInit();

    expect(component.notifications).toEqual([]);
    expect(component.unreadCount).toBe(0);
    expect(component.expandedNotificationIds.size).toBe(0);
  });

  it('should reload notifications when refresh or auth streams emit', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    notificationServiceSpy.getUserNotifications.mockReturnValue(of([]));
    fixture.detectChanges();
    notificationServiceSpy.getUserNotifications.mockClear();

    refreshNotifications$.next();
    authUser$.next({ id: 7 });

    expect(notificationServiceSpy.getUserNotifications).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();

    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should log out through auth service', () => {
    component.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should navigate to bookings when outside bookings page', () => {
    routerSpy.url = '/search';

    component.goToMyBookings();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/my-bookings']);
    expect(bookingServiceSpy.requestBookingsRefresh).not.toHaveBeenCalled();
  });

  it('should refresh bookings when already on bookings page', () => {
    routerSpy.url = '/my-bookings';

    component.goToMyBookings();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(bookingServiceSpy.requestBookingsRefresh).toHaveBeenCalled();
  });

  it('should toggle notifications and load when opened', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);

    component.toggleNotifications();
    expect(component.showNotifications).toBe(true);
    expect(notificationServiceSpy.getUserNotifications).toHaveBeenCalledWith(7);

    notificationServiceSpy.getUserNotifications.mockClear();
    component.toggleNotifications();
    expect(component.showNotifications).toBe(false);
    expect(notificationServiceSpy.getUserNotifications).not.toHaveBeenCalled();
  });

  it('should render notification menu, unread badge, admin links, and logout for admin users', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.isAdmin.mockReturnValue(true);
    notificationServiceSpy.getUserNotifications.mockReturnValue(of([unreadNotification]));
    component.showNotifications = true;

    fixture.detectChanges();

    const pageText = textContent();
    expect(pageText).toContain('Notifications');
    expect(pageText).toContain('1');
    expect(pageText).toContain('Booking Confirmed');
    expect(pageText).toContain('Mark all read');
    expect(pageText).toContain('Manage Hotels');
    expect(pageText).toContain('Manage Rooms');
    expect(pageText).toContain('Logout');
    expect(pageText).not.toContain('Login');
  });

  it('should render empty notification menu', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    notificationServiceSpy.getUserNotifications.mockReturnValue(of([]));
    component.showNotifications = true;

    fixture.detectChanges();

    expect(textContent()).toContain('No notifications.');
  });

  it('should open an unread notification and mark it as read', () => {
    const updated = { ...unreadNotification, read: true };
    component.notifications = [unreadNotification, readNotification];
    component.unreadCount = 1;
    notificationServiceSpy.markAsRead.mockReturnValue(of(updated));

    component.openNotification(unreadNotification);

    expect(component.expandedNotificationIds.has(1)).toBe(true);
    expect(notificationServiceSpy.markAsRead).toHaveBeenCalledWith(1);
    expect(component.notifications[0]).toEqual(updated);
    expect(component.unreadCount).toBe(0);
  });

  it('should not mark expanded or already-read notifications as read', () => {
    component.expandedNotificationIds.add(1);
    component.openNotification(unreadNotification);
    expect(notificationServiceSpy.markAsRead).not.toHaveBeenCalled();

    component.openNotification(readNotification);
    expect(component.expandedNotificationIds.has(2)).toBe(true);
    expect(notificationServiceSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('should mark all notifications as read when there is a current user and unread notifications', () => {
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    component.notifications = [unreadNotification, { ...readNotification, read: false }];
    component.unreadCount = 2;
    notificationServiceSpy.markAllAsRead.mockReturnValue(of(undefined));

    component.markAllAsRead();

    expect(notificationServiceSpy.markAllAsRead).toHaveBeenCalledWith(7);
    expect(component.notifications.every((notification) => notification.read)).toBe(true);
    expect(component.unreadCount).toBe(0);
  });

  it('should not mark all notifications as read without a user or unread count', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    component.unreadCount = 2;
    component.markAllAsRead();
    expect(notificationServiceSpy.markAllAsRead).not.toHaveBeenCalled();

    authServiceSpy.getCurrentUser.mockReturnValue({ id: 7 });
    component.unreadCount = 0;
    component.markAllAsRead();
    expect(notificationServiceSpy.markAllAsRead).not.toHaveBeenCalled();
  });

  it('should format notification title and fallback messages', () => {
    expect(component.getNotificationTitle(unreadNotification)).toBe('Booking Confirmed');
    expect(component.getNotificationMessage(unreadNotification)).toBe('Booking confirmed');
    expect(component.getNotificationMessage(readNotification)).toBe('Payment body');
    expect(component.getNotificationMessage({
      id: 3,
      type: 'ROOM_READY',
      read: true,
      createdAt: '2026-05-14T12:00:00Z',
    })).toBe('Room Ready');
  });
});
