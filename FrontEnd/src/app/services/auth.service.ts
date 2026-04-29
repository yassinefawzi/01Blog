import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authUrl = 'http://localhost:8080/api/auth';
  private userUrl = 'http://localhost:8080/api/users';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}
  register(userData: any): Observable<any> {
    return this.http.post(`${this.userUrl}/register`, userData);
  }
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          console.log('Token saved to LocalStorage');
        }
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  checkAuth(action: () => void): void {
    if (this.isLoggedIn()) {
      action();
    } else {
      this.router.navigate(['/login']);
    }
  }

  getUsername(): string {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No token found! User must be logged in.');
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  }
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
