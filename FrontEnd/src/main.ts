import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component'; // Make sure this points to your app.component.ts

console.log('Main.ts is executing...'); // Add this to verify the file runs

bootstrapApplication(AppComponent, appConfig) // This MUST be AppComponent
  .catch((err) => console.error('Bootstrap failed:', err));