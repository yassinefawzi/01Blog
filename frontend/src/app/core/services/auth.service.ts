import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'blog01_token';
  private readonly userKey = 'blog01_user';

  currentUser = signal<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(data: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(queryParams?: Record<string, string>): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login'], { queryParams });
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  refreshSession(): Observable<User | null> {
    const user = this.currentUser();
    if (!this.token || !user?.username) return of(null);
    return this.http.get<User>(`${environment.apiUrl}/users/${encodeURIComponent(user.username)}`).pipe(
      tap(fresh => {
        const current = this.currentUser();
        if (!current || current.id !== fresh.id) return;
        if (fresh.banned) {
          this.logout({ banned: '1' });
          return;
        }
        if (current.role === fresh.role && current.banned === fresh.banned) return;
        this.updateCurrentUser({ ...current, ...fresh });
      }),
      catchError(() => of(null))
    );
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }
}
