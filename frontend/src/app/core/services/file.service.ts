import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private http: HttpClient) {}

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string; mediaType: string }>(
      `${environment.apiUrl}/files/upload`, form
    );
  }
}
