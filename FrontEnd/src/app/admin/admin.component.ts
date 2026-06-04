import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminReport, AdminUser, AdminStats } from '../services/admin.service';
import { Post } from '../models/post.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);

  activeTab: 'users' | 'posts' | 'reports' = 'users';
  users: AdminUser[] = [];
  posts: Post[] = [];
  reports: AdminReport[] = [];
  stats: AdminStats | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  switchTab(tab: 'users' | 'posts' | 'reports') {
    this.activeTab = tab;
    if (tab === 'users') this.loadUsers();
    if (tab === 'posts') this.loadPosts();
    if (tab === 'reports') this.loadReports();
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (stats) => (this.stats = stats),
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({ next: (data) => (this.users = data) });
  }

  loadPosts() {
    this.adminService.getPosts().subscribe({ next: (data) => (this.posts = data) });
  }

  loadReports() {
    this.adminService.getReports().subscribe({ next: (data) => (this.reports = data) });
  }

  banUser(user: AdminUser) {
    if (!confirm(`Ban @${user.username}?`)) return;
    this.adminService.banUser(user.id).subscribe({ next: () => this.loadUsers() });
  }

  unbanUser(user: AdminUser) {
    this.adminService.unbanUser(user.id).subscribe({ next: () => this.loadUsers() });
  }

  deleteUser(user: AdminUser) {
    if (!confirm(`Permanently delete @${user.username}?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.loadStats();
      },
    });
  }

  deletePost(post: Post) {
    if (!post.id || !confirm('Delete this post permanently?')) return;
    this.adminService.deletePost(post.id).subscribe({ next: () => this.loadPosts() });
  }

  hidePost(post: Post) {
    if (!post.id || !confirm('Hide this post from public feeds?')) return;
    this.adminService.hidePost(post.id).subscribe({ next: () => this.loadPosts() });
  }

  resolveReport(report: AdminReport) {
    this.adminService.resolveReport(report.id).subscribe({ next: () => this.loadReports() });
  }

  postAuthor(post: Post): string {
    if (typeof post.author === 'object' && post.author?.username) {
      return post.author.username;
    }
    return (post as any).authorName || 'unknown';
  }
}
