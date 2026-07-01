import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, PageResponse } from '../models';
import { AuthService } from './auth.service';
import { WebSocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private ws = inject(WebSocketService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  private connectedUserId: number | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        if (this.connectedUserId !== user.id) {
          this.connectedUserId = user.id;
          this.connect(user.id);
          this.refresh();
        }
      } else {
        this.connectedUserId = null;
        this.ws.disconnect();
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  refresh(): void {
    this.getUnreadCount().subscribe(r => this.unreadCount.set(r.count));
    this.getNotifications(0, 10).subscribe(r => this.notifications.set(r.content));
  }

  getNotifications(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Notification>>(`${environment.apiUrl}/notifications`, { params });
  }

  getUnreadCount() {
    return this.http.get<{ count: number }>(`${environment.apiUrl}/notifications/unread-count`);
  }

  markAsRead(id: number) {
    return this.http.patch<Notification>(`${environment.apiUrl}/notifications/${id}/read`, {}).pipe(
      tap(updated => this.applyRead(updated))
    );
  }

  markAllAsRead() {
    return this.http.patch<void>(`${environment.apiUrl}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.unreadCount.set(0);
      })
    );
  }

  private connect(userId: number): void {
    this.ws.connect<Notification>(
      `/topic/users/${userId}/notifications`,
      notification => this.pushNotification(notification)
    );
  }

  private pushNotification(notification: Notification): void {
    this.notifications.update(list => {
      if (list.some(n => n.id === notification.id)) {
        return list;
      }
      return [notification, ...list].slice(0, 20);
    });
    if (!notification.read) {
      this.unreadCount.update(count => count + 1);
    }
  }

  private applyRead(notification: Notification): void {
    this.notifications.update(list =>
      list.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );
    this.unreadCount.update(count => Math.max(0, count - 1));
  }
}
