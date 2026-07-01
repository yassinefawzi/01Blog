import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models';
import { UserSearchComponent } from '../../shared/user-search/user-search.component';
import { UserStatsService } from '../../core/services/user-stats.service';

@Component({
  selector: 'app-user-search-page',
  standalone: true,
  imports: [
    RouterLink, UpperCasePipe, MatIconModule, MatProgressSpinnerModule,
    MatButtonModule, UserSearchComponent
  ],
  templateUrl: './user-search-page.component.html',
  styleUrl: './user-search-page.component.scss'
})
export class UserSearchPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private userStats = inject(UserStatsService);

  query = signal('');
  results = signal<User[]>([]);
  loading = signal(false);

  displayResults = computed(() => {
    this.userStats.cache();
    return this.results().map(user => {
      const counts = this.userStats.resolveCounts(user.username, {
        followersCount: user.followersCount,
        followingCount: user.followingCount
      });
      return { ...user, ...counts };
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q') ?? '';
      this.query.set(q);
      this.search(q);
    });
  }

  private search(q: string): void {
    if (q.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.loading.set(true);
    this.userService.searchUsers(q, 20).subscribe({
      next: users => {
        users.forEach(u => this.userStats.seedFromUser(u));
        this.results.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }
}
