import { Component } from '@angular/core';
import { RegisterComponent } from './register/register.component';
import { AuthService } from './services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.checkSession().subscribe();
  }
}
