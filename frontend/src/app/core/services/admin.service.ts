import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminStats, PageResponse, Report, ReportStatus, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }

  getUsers(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<User>>(`${environment.apiUrl}/admin/users`, { params });
  }

  banUser(id: number, banned: boolean) {
    const params = new HttpParams().set('banned', banned);
    return this.http.patch<User>(`${environment.apiUrl}/admin/users/${id}/ban`, {}, { params });
  }

  makeAdmin(id: number) {
    return this.http.patch<User>(`${environment.apiUrl}/admin/users/${id}/make-admin`, {});
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/admin/users/${id}`);
  }

  deletePost(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/admin/posts/${id}`);
  }

  hidePost(id: number, hidden: boolean) {
    const params = new HttpParams().set('hidden', hidden);
    return this.http.patch<import('../models').Post>(
      `${environment.apiUrl}/admin/posts/${id}/hide`, {}, { params }
    );
  }

  getPosts(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<import('../models').Post>>(`${environment.apiUrl}/admin/posts`, { params });
  }

  getReports(page = 0, size = 20, status?: ReportStatus) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Report>>(`${environment.apiUrl}/admin/reports`, { params });
  }

  resolveReport(id: number, status: ReportStatus) {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Report>(`${environment.apiUrl}/admin/reports/${id}`, {}, { params });
  }
}
