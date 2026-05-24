import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/users';

  getUserProfile(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile/${username}`, {
      withCredentials: true,
    });
  }

  toggleFollow(username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/follow/${username}`, {});
  }

  getFollowMeta(username: string): Observable<{ followersCount: number; followingCount: number }> {
    return this.http.get<{ followersCount: number; followingCount: number }>(
      `${this.baseUrl}/profile/${username}/meta`,
    );
  }
  getProfile(username: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile/${username}`);
  }
}
