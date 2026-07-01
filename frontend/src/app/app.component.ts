import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';

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
export class AppComponent {}
