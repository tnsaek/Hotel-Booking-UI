import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments';
import { AppNotification } from '../models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private api = `${environment.apiUrl}/notifications`;
  private refreshNotificationsSubject = new Subject<void>();
  refreshNotifications$ = this.refreshNotificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUserNotifications(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.api}/user/${userId}`);
  }

  getUnreadCount(userId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/user/${userId}/unread-count`);
  }

  markAsRead(notificationId: number): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.api}/${notificationId}/read`, null);
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.api}/user/${userId}/read-all`, null);
  }

  requestNotificationsRefresh(): void {
    this.refreshNotificationsSubject.next();
  }
}
