import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Post } from '../models/post.model';
import { CreatePostComponent } from '../create-post/create-post.component';
import { NotificationService, AppNotification } from '../services/notification.service';
import { MessageService } from '../services/message.service';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CreatePostComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private messageService = inject(MessageService);
  private websocketService = inject(WebsocketService);
  private subs = new Subscription();

  isCreateModalOpen = false;
  searchQuery = '';
  user$ = this.authService.currentUser$;
  isAdmin = false;

  notifications: AppNotification[] = [];
  unreadCount = 0;
  unreadMessages = 0;
  showNotifications = false;

  @Output() postAdded = new EventEmitter<Post>();

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.subs.add(
      this.authService.currentUser$.subscribe(() => {
        this.isAdmin = this.authService.isAdmin();
        if (this.authService.isLoggedIn()) {
          this.refreshCounts();
        }
      }),
    );
    this.subs.add(
      this.websocketService.incomingNotification$.subscribe((n) => {
        this.notifications = [n, ...this.notifications];
        if (!n.read) this.unreadCount++;
      }),
    );
    this.subs.add(
      this.websocketService.incomingMessage$.subscribe(() => {
        this.messageService.getUnreadCount().subscribe({
          next: (res) => (this.unreadMessages = res.count),
        });
      }),
    );
    if (this.authService.isLoggedIn()) {
      this.refreshCounts();
    }
  }

  refreshCounts() {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => (this.unreadCount = res.count),
    });
    this.messageService.getUnreadCount().subscribe({
      next: (res) => (this.unreadMessages = res.count),
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.notificationService.getNotifications().subscribe({
        next: (data) => (this.notifications = data),
      });
    }
  }

  markNotificationRead(notification: AppNotification) {
    if (notification.read) return;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
    });
  }

  markAllNotificationsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
        this.unreadCount = 0;
      },
    });
  }

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  logout() {
    this.authService.logout();
  }

  openCreatePost() {
    this.authService.checkAuth(() => {
      this.isCreateModalOpen = true;
      document.body.style.overflow = 'hidden';
    });
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  onPostCreated(newPost: Post) {
    this.postAdded.emit(newPost);
    this.closeCreateModal();
  }
}
