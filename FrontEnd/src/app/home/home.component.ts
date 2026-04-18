import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent { 
  searchQuery: string = '';

  constructor(private router: Router) {}

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}