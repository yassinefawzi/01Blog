import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  banned: boolean;
  postCount: number;
  roles: string[];
}

export interface AdminReport {
  id: number;
  reporterUsername: string;
  reportedUsername: string;
  reason: string;
  createdAt: string;
  status: string;
}

export interface AdminStats {
  userCount: number;
  postCount: number;
  reportCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`, { withCredentials: true });
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts`, { withCredentials: true });
  }

  getReports(): Observable<AdminReport[]> {
    return this.http.get<AdminReport[]>(`${this.apiUrl}/reports`, { withCredentials: true });
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`, { withCredentials: true });
  }

  banUser(userId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/ban`, {}, { withCredentials: true });
  }

  unbanUser(userId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/unban`, {}, { withCredentials: true });
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${userId}`, { withCredentials: true });
  }

  deletePost(postId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/posts/${postId}`, { withCredentials: true });
  }

  hidePost(postId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/posts/${postId}/hide`, {}, { withCredentials: true });
  }

  resolveReport(reportId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/reports/${reportId}/resolve`, {}, { withCredentials: true });
  }
}
