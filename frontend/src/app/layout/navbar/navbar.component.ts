import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models';
import { UserSearchComponent } from '../../shared/user-search/user-search.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, UpperCasePipe, MatButtonModule,
    MatIconModule, MatBadgeModule, MatMenuModule, MatDividerModule,
    UserSearchComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  auth = inject(AuthService);
  notifications = inject(NotificationService);
  theme = inject(ThemeService);

  markRead(n: Notification): void {
    if (!n.read) {
      this.notifications.markAsRead(n.id).subscribe();
    }
  }

  markAllRead(): void {
    this.notifications.markAllAsRead().subscribe();
  }

  logout(): void {
    this.auth.logout();
  }

  getNotifIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      NEW_POST: 'article',
      NEW_FOLLOWER: 'person_add',
      NEW_COMMENT: 'chat_bubble',
      NEW_LIKE: 'favorite'
    };
    return icons[type] ?? 'notifications';
  }
}
