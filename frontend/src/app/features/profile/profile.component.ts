import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { PostService } from '../../core/services/post.service';
import { User, Post } from '../../core/models';
import { PostCardComponent } from '../../shared/post-card/post-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ReportDialogComponent } from '../../shared/report-dialog/report-dialog.component';
import { ConnectionsBlockComponent } from '../../shared/connections-block/connections-block.component';
import { UserStatsService } from '../../core/services/user-stats.service';
import { UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    PostCardComponent, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, UpperCasePipe, RouterLink, ConnectionsBlockComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private userStats = inject(UserStatsService);

  user = signal<User | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);
  connectionsTab = signal<'followers' | 'following'>('followers');
  showConnectionsBlock = signal(false);

  displayUser = computed(() => {
    const u = this.user();
    if (!u) return null;
    this.userStats.cache();
    const counts = this.userStats.resolveCounts(u.username, {
      followersCount: u.followersCount,
      followingCount: u.followingCount,
      postCount: this.posts().length
    });
    return { ...u, ...counts };
  });

  connectionsListRefresh = computed(() => {
    const u = this.user();
    return u ? this.userStats.listRefreshKey(u.username) : 0;
  });

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private postService: PostService,
    public auth: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username')!;
      this.loadProfile(username);
    });
  }

  loadProfile(username: string): void {
    this.loading.set(true);
    this.showConnectionsBlock.set(false);
    this.userService.getProfile(username).subscribe({
      next: user => {
        this.user.set(user);
        this.userStats.seedFromUser(user);
        this.postService.getUserPosts(username).subscribe(res => {
          this.posts.set(res.content);
          this.userStats.patch(username, { postCount: res.content.length });
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false)
    });
  }

  toggleSubscribe(): void {
    const u = this.user();
    if (!u) return;
    const action = u.subscribed ? 'Unsubscribe from' : 'Subscribe to';
    if (!confirm(`${action} ${u.username}?`)) return;
    this.userService.toggleSubscription(u.username).subscribe(res => {
      this.user.set({ ...u, subscribed: res.subscribed });
    });
  }

  onPostDeleted(postId: number): void {
    const u = this.user();
    this.posts.update(list => list.filter(p => p.id !== postId));
    if (u) {
      this.userStats.patch(u.username, { postCount: this.posts().length });
    }
  }

  reportUser(): void {
    const u = this.user();
    if (u) {
      this.dialog.open(ReportDialogComponent, {
        width: '400px',
        data: { reportedUserId: u.id }
      });
    }
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.userService.uploadAvatar(file).subscribe(user => {
      this.user.set(user);
      this.auth.updateCurrentUser(user);
    });
  }

  showConnections(tab: 'followers' | 'following'): void {
    if (this.showConnectionsBlock() && this.connectionsTab() === tab) {
      this.showConnectionsBlock.set(false);
      return;
    }
    this.connectionsTab.set(tab);
    this.showConnectionsBlock.set(true);
    setTimeout(() => {
      document.getElementById('connections-block')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  hideConnections(): void {
    this.showConnectionsBlock.set(false);
  }

  isStatActive(tab: 'followers' | 'following'): boolean {
    return this.showConnectionsBlock() && this.connectionsTab() === tab;
  }
}
