import { Component } from '@angular/core';
import { register } from 'module';
import { RegisterComponent } from './register/register.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RegisterComponent],
  template: `
    <app-register></app-register>
  `
})
export class AppComponent {}