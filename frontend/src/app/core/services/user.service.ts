import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models';
import { AuthService } from './auth.service';
import { UserStatsService } from './user-stats.service';

export interface SubscriptionToggleResult {
  subscribed: boolean;
  followersCount: number;
  followingCount: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private userStats: UserStatsService
  ) {}

  searchUsers(q: string, limit = 10) {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.http.get<User[]>(`${environment.apiUrl}/users/search?${params}`);
  }

  getProfile(username: string) {
    return this.http.get<User>(`${environment.apiUrl}/users/${username}`);
  }

  updateProfile(bio: string) {
    return this.http.put<User>(`${environment.apiUrl}/users/me`, { bio });
  }

  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<User>(`${environment.apiUrl}/users/me/avatar`, form);
  }

  toggleSubscription(username: string) {
    return this.http.post<SubscriptionToggleResult>(
      `${environment.apiUrl}/subscriptions/${username}`, {}
    ).pipe(
      tap(res => {
        const current = this.auth.currentUser();
        this.userStats.applySubscriptionToggle(
          username,
          res.followersCount,
          current?.username,
          res.followingCount
        );
        if (current) {
          this.auth.updateCurrentUser({ ...current, followingCount: res.followingCount });
        }
      })
    );
  }

  getFollowers(username: string) {
    return this.http.get<import('../models').UserSummary[]>(
      `${environment.apiUrl}/subscriptions/${username}/followers`
    );
  }

  getFollowing(username: string) {
    return this.http.get<import('../models').UserSummary[]>(
      `${environment.apiUrl}/subscriptions/${username}/following`
    );
  }
}
