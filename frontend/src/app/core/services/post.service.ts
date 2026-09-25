import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageResponse, Post } from '../models';
import { AuthService } from './auth.service';
import { UserStatsService } from './user-stats.service';

@Injectable({ providedIn: 'root' })
export class PostService {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private userStats: UserStatsService
  ) {}

  getFeed(page = 0, size = 10) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Post>>(`${environment.apiUrl}/posts/feed`, { params });
  }

  getUserPosts(username: string, page = 0, size = 10) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Post>>(`${environment.apiUrl}/posts/user/${username}`, { params });
  }

  getPost(id: number) {
    return this.http.get<Post>(`${environment.apiUrl}/posts/${id}`);
  }

  createPost(data: { description: string; mediaUrl?: string; mediaType?: string }) {
    return this.http.post<Post>(`${environment.apiUrl}/posts`, data).pipe(
      tap(() => {
        const user = this.auth.currentUser();
        if (user) {
          this.userStats.adjustPostCount(user.username, 1);
        }
      })
    );
  }

  updatePost(id: number, data: { description: string; mediaUrl?: string | null; mediaType?: string }) {
    return this.http.put<Post>(`${environment.apiUrl}/posts/${id}`, data);
  }

  deletePost(id: number, authorUsername?: string) {
    return this.http.delete<void>(`${environment.apiUrl}/posts/${id}`).pipe(
      tap(() => {
        const username = authorUsername ?? this.auth.currentUser()?.username;
        if (username) {
          this.userStats.adjustPostCount(username, -1);
        }
      })
    );
  }

  toggleLike(postId: number) {
    return this.http.post<{ liked: boolean; likesCount: number }>(
      `${environment.apiUrl}/posts/${postId}/likes`, {}
    );
  }

  getComments(postId: number) {
    return this.http.get<import('../models').Comment[]>(`${environment.apiUrl}/posts/${postId}/comments`);
  }

  addComment(postId: number, content: string) {
    return this.http.post<import('../models').Comment>(
      `${environment.apiUrl}/posts/${postId}/comments`, { content }
    );
  }

  deleteComment(postId: number, commentId: number) {
    return this.http.delete<void>(`${environment.apiUrl}/posts/${postId}/comments/${commentId}`);
  }
}
