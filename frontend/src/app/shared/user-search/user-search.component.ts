import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../core/services/user.service';
import { UserStatsService } from '../../core/services/user-stats.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [FormsModule, RouterLink, UpperCasePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './user-search.component.html',
  styleUrl: './user-search.component.scss'
})
export class UserSearchComponent {
  private userService = inject(UserService);
  private userStats = inject(UserStatsService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  query = '';
  results = signal<User[]>([]);
  loading = signal(false);
  open = signal(false);

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

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(q => {
        if (q.trim().length < 2) {
          this.results.set([]);
          this.loading.set(false);
          return of([]);
        }
        return this.userService.searchUsers(q).pipe(
          catchError(() => of([] as User[]))
        );
      }),
      takeUntilDestroyed()
    ).subscribe(users => {
      users.forEach(u => this.userStats.seedFromUser(u));
      this.results.set(users);
      this.loading.set(false);
      this.open.set(this.query.trim().length >= 2);
    });
  }

  onInput(): void {
    this.search$.next(this.query);
    if (this.query.trim().length < 2) {
      this.open.set(false);
      this.results.set([]);
    }
  }

  onFocus(): void {
    if (this.query.trim().length >= 2) {
      this.open.set(true);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const q = this.query.trim();
    if (q.length >= 2) {
      this.close();
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }

  selectUser(): void {
    this.close();
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
