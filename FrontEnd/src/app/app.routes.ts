import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
	{ path: 'register', component: RegisterComponent },
	{ path: '', redirectTo: 'register', pathMatch: 'full' },
];
