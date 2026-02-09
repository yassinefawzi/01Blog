import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  city: string = '';

  register(form: any) {
    console.log('Register clicked');
	if (!form.valid) {
    	console.log("Form is invalid!");
    	return;
  	}
    console.log(this.firstName, this.lastName, this.username, this.email, this.password, this.phoneNumber, this.city);
  }
}
