import { Injectable, signal } from '@angular/core';
import { User } from '../models';

export interface UserCounts {
  followersCount?: number;
  followingCount?: number;
  postCount?: number;
}

@Injectable({ providedIn: 'root' })
export class UserStatsService {
  private readonly counts = signal<Record<string, UserCounts>>({});
  private readonly listRefreshKeys = signal<Record<string, number>>({});

  readonly cache = this.counts.asReadonly();

  seedFromUser(user: User, postCount?: number): void {
    this.seed(user.username, {
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      ...(postCount !== undefined ? { postCount } : {})
    });
  }

  seed(username: string, counts: UserCounts): void {
    this.counts.update(c => ({
      ...c,
      [username]: { ...c[username], ...counts }
    }));
  }

  patch(username: string, partial: UserCounts): void {
    this.counts.update(c => ({
      ...c,
      [username]: { ...c[username], ...partial }
    }));
  }

  adjustPostCount(username: string, delta: number): void {
    this.counts.update(c => {
      const existing = c[username]?.postCount;
      if (existing === undefined) {
        if (delta > 0) {
          return { ...c, [username]: { ...c[username], postCount: delta } };
        }
        return c;
      }
      return {
        ...c,
        [username]: { ...c[username], postCount: Math.max(0, existing + delta) }
      };
    });
  }

  applySubscriptionToggle(
    targetUsername: string,
    followersCount: number,
    currentUsername: string | undefined,
    followingCount: number
  ): void {
    this.patch(targetUsername, { followersCount });
    if (currentUsername) {
      this.patch(currentUsername, { followingCount });
    }
    this.invalidateLists(targetUsername);
    if (currentUsername) {
      this.invalidateLists(currentUsername);
    }
  }

  listRefreshKey(username: string): number {
    return this.listRefreshKeys()[username] ?? 0;
  }

  resolveCounts(
    username: string,
    defaults: { followersCount: number; followingCount: number; postCount?: number }
  ): Required<Pick<UserCounts, 'followersCount' | 'followingCount'>> & { postCount: number } {
    const cached = this.counts()[username];
    return {
      followersCount: cached?.followersCount ?? defaults.followersCount,
      followingCount: cached?.followingCount ?? defaults.followingCount,
      postCount: cached?.postCount ?? defaults.postCount ?? 0
    };
  }

  private invalidateLists(username: string): void {
    this.listRefreshKeys.update(keys => ({
      ...keys,
      [username]: (keys[username] ?? 0) + 1
    }));
  }
}
