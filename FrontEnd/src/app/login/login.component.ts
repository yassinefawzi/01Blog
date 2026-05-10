import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  returnUrl: string = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  login(form: any) {
    if (!form.valid) return;

    const credentials = {
      username: this.username,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        console.log('Login successful:', user.username);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        console.error('Login failed', error);
      },
    });
  }
}
