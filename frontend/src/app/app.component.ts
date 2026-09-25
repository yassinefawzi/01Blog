import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="app-main">
      <router-outlet />
    </main>
  `,
  styles: [`
    .app-main {
      min-height: calc(100vh - var(--nav-height));
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private navSub: Subscription | null = null;
  private readonly onVisible = () => {
    if (document.visibilityState === 'visible') this.auth.refreshSession().subscribe();
  };

  ngOnInit(): void {
    document.addEventListener('visibilitychange', this.onVisible);
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.auth.refreshSession().subscribe());
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisible);
    this.navSub?.unsubscribe();
  }
}
