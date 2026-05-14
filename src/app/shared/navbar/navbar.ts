import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { BookingService } from '../../services/booking-service';
import { NotificationService } from '../../services/notification-service';
import { AppNotification } from '../../models/notification';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  showNotifications = false;
  expandedNotificationIds = new Set<number>();
  private refreshSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.refreshSubscription = this.notificationService.refreshNotifications$.subscribe(() => {
      this.loadNotifications();
    });
    this.authSubscription = this.authService.currentUser$.subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  goToMyBookings(): void {
    if (!this.router.url.startsWith('/my-bookings')) {
      this.router.navigate(['/my-bookings']);
      return;
    }

    this.bookingService.requestBookingsRefresh();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  openNotification(notification: AppNotification): void {
    if (this.expandedNotificationIds.has(notification.id)) {
      return;
    }

    this.expandedNotificationIds.add(notification.id);

    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        this.notifications = this.notifications.map((item) =>
          item.id === updatedNotification.id ? updatedNotification : item
        );
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
    });
  }

  markAllAsRead(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || this.unreadCount === 0) {
      return;
    }

    this.notificationService.markAllAsRead(currentUser.id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
        this.unreadCount = 0;
      },
    });
  }

  getNotificationTitle(notification: AppNotification): string {
    return this.formatNotificationType(notification.type);
  }

  getNotificationMessage(notification: AppNotification): string {
    return notification.message || notification.body || this.formatNotificationType(notification.type);
  }

  private loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.authService.isAuthenticated()) {
      this.notifications = [];
      this.unreadCount = 0;
      this.expandedNotificationIds.clear();
      return;
    }

    this.notificationService.getUserNotifications(currentUser.id).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter((notification) => !notification.read).length;
        this.expandedNotificationIds = new Set(
          [...this.expandedNotificationIds].filter((id) =>
            notifications.some((notification) => notification.id === id)
          )
        );
      },
      error: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.expandedNotificationIds.clear();
      },
    });
  }

  private formatNotificationType(type: string): string {
    return type
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
