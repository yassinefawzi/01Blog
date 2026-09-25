import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule, MatIconModule, RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  loading = false;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('banned') === '1') {
      this.snackBar.open('Your account has been banned.', 'OK', { duration: 5000 });
    } else if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      this.snackBar.open('Your session expired. Please sign in again.', 'OK', { duration: 5000 });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value as { username: string; password: string }).subscribe({
      next: () => this.router.navigate(['/feed']),
      error: err => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Login failed', 'OK', { duration: 4000 });
      },
      complete: () => this.loading = false
    });
  }
}
