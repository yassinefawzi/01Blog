import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/users';

  getProfile(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/${username}`, { withCredentials: true });
  }

  toggleFollow(targetUsername: string, currentUsername: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/follow/${targetUsername}?currentUsername=${currentUsername}`,
      {},
      { withCredentials: true },
    );
  }
}
