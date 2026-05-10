import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/users';

  getUserProfile(username: string): Observable<any> {
    return this.http.get(`http://localhost:8080/api/users/profile/${username}`, {
      withCredentials: true,
    });
  }

  toggleFollow(targetUsername: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow/${targetUsername}`, {}, { withCredentials: true });
  }
  getProfile(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/${username}`, { withCredentials: true });
  }
}
