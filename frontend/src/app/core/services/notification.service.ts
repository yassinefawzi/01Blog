import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, PageResponse } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  private loadedUserId: number | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 30_000;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        if (this.loadedUserId !== user.id) {
          this.loadedUserId = user.id;
          this.refresh();
        }
        this.startPolling();
      } else {
        this.loadedUserId = null;
        this.notifications.set([]);
        this.unreadCount.set(0);
        this.stopPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
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

  private applyRead(notification: Notification): void {
    this.notifications.update(list =>
      list.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );
    this.unreadCount.update(count => Math.max(0, count - 1));
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (this.auth.currentUser()) {
        this.refresh();
      }
    }, this.POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
