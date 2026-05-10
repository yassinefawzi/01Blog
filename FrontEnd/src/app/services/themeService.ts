import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);

  darkMode$ = this.isDarkMode.asObservable();

  toggleTheme() {
    this.isDarkMode.next(!this.isDarkMode.value);
  }
}