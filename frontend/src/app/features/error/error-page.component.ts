import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page-shell">
      <div class="page-container">
        <div class="state-box error-page">
          <mat-icon>{{ icon() }}</mat-icon>
          <p class="error-code">{{ code() }}</p>
          <h3>{{ title() }}</h3>
          <p>{{ message() }}</p>
          @if (showSignIn()) {
            <a mat-flat-button color="primary" routerLink="/login" class="btn-pill">Sign in</a>
          } @else if (auth.isLoggedIn) {
            <a mat-flat-button color="primary" routerLink="/feed" class="btn-pill">Back to feed</a>
          } @else {
            <a mat-flat-button color="primary" routerLink="/login" class="btn-pill">Sign in</a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      margin-top: 2rem;
    }
    .error-code {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-subtle);
    }
  `]
})
export class ErrorPageComponent implements OnInit {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  code = signal('500');

  ngOnInit(): void {
    const fallback = this.route.snapshot.data['code'] as string | undefined;
    this.route.queryParamMap.subscribe(params => {
      this.code.set(params.get('code') || fallback || '500');
    });
  }

  icon(): string {
    switch (this.code()) {
      case '404': return 'search_off';
      case '403': return 'lock';
      case 'banned': return 'block';
      case 'expired':
      case '401': return 'logout';
      default: return 'error_outline';
    }
  }

  title(): string {
    switch (this.code()) {
      case '404': return 'Page not found';
      case '403': return 'Access denied';
      case 'banned': return 'Account banned';
      case 'expired': return 'Session expired';
      case '401': return 'Sign in required';
      default: return 'Something went wrong';
    }
  }

  message(): string {
    switch (this.code()) {
      case '404': return 'This page does not exist, or it was removed.';
      case '403': return 'You do not have permission to view this.';
      case 'banned': return 'Your account has been banned. An admin must unban it before you can sign in again.';
      case 'expired': return 'Your session expired. Sign in again to continue.';
      case '401': return 'Your session is no longer valid. Sign in again to continue.';
      default: return 'The server could not complete this request. Try again in a moment.';
    }
  }

  showSignIn(): boolean {
    return this.code() === '401' || this.code() === 'expired' || this.code() === 'banned';
  }
}
