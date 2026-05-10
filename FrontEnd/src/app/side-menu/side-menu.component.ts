import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../services/themeService';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css'],
})
export class SideMenuComponent {
  private themeService = inject(ThemeService);

  @Input() activeCategory: string = 'All';
  @Output() categoryChanged = new EventEmitter<string>();

  darkMode$ = this.themeService.darkMode$;

  categories = [
    { name: 'All', icon: 'apps' },
    { name: 'General', icon: 'public' },
    { name: 'Technology', icon: 'memory' },
    { name: 'Lifestyle', icon: 'favorite' },
  ];

  onToggleTheme() {
    this.themeService.toggleTheme();
  }

  selectCategory(category: string) {
    this.categoryChanged.emit(category);
  }

}
