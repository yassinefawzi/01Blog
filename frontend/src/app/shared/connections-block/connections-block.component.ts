import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';
import { UserSummary } from '../../core/models';

type ConnectionTab = 'followers' | 'following';

@Component({
  selector: 'app-connections-block',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './connections-block.component.html',
  styleUrl: './connections-block.component.scss'
})
export class ConnectionsBlockComponent implements OnChanges {
  @Input({ required: true }) username!: string;
  @Input() activeTab: ConnectionTab = 'followers';
  @Input() listRefreshKey = 0;

  private userService = inject(UserService);

  followers = signal<UserSummary[]>([]);
  following = signal<UserSummary[]>([]);
  loading = signal(false);
  tab = signal<ConnectionTab>('followers');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['username']) {
      this.followers.set([]);
      this.following.set([]);
    }
    if (changes['listRefreshKey'] && !changes['listRefreshKey'].firstChange) {
      this.followers.set([]);
      this.following.set([]);
    }
    this.tab.set(this.activeTab);
    if (this.username) {
      this.loadTab(this.activeTab, !!changes['listRefreshKey'] && !changes['listRefreshKey'].firstChange);
    }
  }

  selectTab(tab: ConnectionTab): void {
    this.tab.set(tab);
    this.loadTab(tab);
  }

  private loadTab(tab: ConnectionTab, force = false): void {
    if (!this.username) return;

    const alreadyLoaded = !force && (tab === 'followers'
      ? this.followers().length > 0
      : this.following().length > 0);

    if (alreadyLoaded) return;

    this.loading.set(true);
    const request = tab === 'followers'
      ? this.userService.getFollowers(this.username)
      : this.userService.getFollowing(this.username);

    request.subscribe({
      next: users => {
        if (tab === 'followers') {
          this.followers.set(users);
        } else {
          this.following.set(users);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  currentList(): UserSummary[] {
    return this.tab() === 'followers' ? this.followers() : this.following();
  }
}
