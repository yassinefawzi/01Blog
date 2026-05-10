import { Injectable, PLATFORM_ID, inject, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authUrl = 'http://localhost:8080/api/auth';
  private userUrl = 'http://localhost:8080/api/users';

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      this.checkSession().subscribe({
        next: (user) => {
          if (!user) this.logoutLocal();
        },
        error: () => this.logoutLocal(),
      });
    } else {
      this.isLoadingSubject.next(false);
    }
  }

  private logoutLocal() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.userUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials).pipe(
      tap((user) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
        this.router.navigate(['/home']);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.authUrl}/logout`, {}).subscribe({
      next: () => {
        this.logoutLocal();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }

  checkSession(): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http.get<any>(`${this.authUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      catchError(() => {
        this.logoutLocal();
        return of(null);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  checkAuth(action: () => void): void {
    if (this.isLoggedIn()) {
      action();
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
    }
  }

  getUsername(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.username : null;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}