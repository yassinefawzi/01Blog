import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'blog01_theme';
  dark = signal(this.storedDark());

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    const next = !this.dark();
    this.dark.set(next);
    localStorage.setItem(this.key, next ? 'dark' : 'light');
    this.apply(next);
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }

  private storedDark(): boolean {
    return localStorage.getItem(this.key) === 'dark';
  }
}
