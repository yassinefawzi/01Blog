import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  city: string = '';

  constructor(private authService: AuthService) {}
  register(form: any) {
    console.log('Register clicked');
    if (!form.valid) {
      console.log('Form is invalid!');
      return;
    }

    const userData = {
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      email: this.email,
      password: this.password,
      phoneNumber: this.phoneNumber,
      city: this.city,
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        form.reset();
      },
      error: (error) => {
        console.error('Registration failed', error);
      },
    });
  }
}
