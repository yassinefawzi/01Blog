import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Report } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  createReport(data: { reportedUserId?: number; reportedPostId?: number; reason: string }) {
    return this.http.post<Report>(`${environment.apiUrl}/reports`, data);
  }
}
