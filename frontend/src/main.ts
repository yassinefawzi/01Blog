import { bootstrapApplication } from '@angular/platform-browser';

(window as unknown as { global: Window }).global = window;
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
