import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}
  register(userData: any): Observable<any> {
    return this.http.post(`${this.userUrl}/register`, userData);
  }
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('username', response.username);
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

  getUsername(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, logging out...');
      this.logout();
      return null;
    }
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
