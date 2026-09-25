import { Component, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStats, Post, Report, User } from '../../../core/models';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatTabsModule, DatePipe, UpperCasePipe, MatSnackBarModule, MatTooltipModule, RouterLink
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  users = signal<User[]>([]);
  posts = signal<Post[]>([]);
  reports = signal<Report[]>([]);

  userColumns = ['username', 'email', 'role', 'actions'];
  postColumns = ['author', 'description', 'status', 'createdAt', 'actions'];
  reportColumns = ['reporter', 'target', 'reason', 'status', 'createdAt', 'actions'];

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.adminService.getStats().subscribe(s => this.stats.set(s));
    this.adminService.getUsers().subscribe(r => this.users.set(r.content));
    this.adminService.getPosts().subscribe(r => this.posts.set(r.content));
    this.adminService.getReports().subscribe(r => this.reports.set(r.content));
  }

  banUser(user: User): void {
    if (!confirm(`${user.banned ? 'Unban' : 'Ban'} user ${user.username}?`)) return;
    this.adminService.banUser(user.id, !user.banned).subscribe(() => {
      this.snackBar.open('User updated', 'OK', { duration: 2000 });
      this.loadAll();
    });
  }

  makeAdmin(user: User): void {
    if (!confirm(`Make ${user.username} an admin? They will have full platform access.`)) {
      return;
    }
    this.adminService.makeAdmin(user.id).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => (u.id === updated.id ? updated : u)));
        this.snackBar.open(`${updated.username} is now an admin`, 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Could not promote user', 'OK', { duration: 2500 })
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.username}? This removes their posts and activity.`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User deleted', 'OK', { duration: 2000 });
          this.loadAll();
        },
        error: () => this.snackBar.open('Could not delete user', 'OK', { duration: 3000 })
      });
    }
  }

  hidePost(postId: number, hidden: boolean): void {
    const action = hidden ? 'Hide' : 'Unhide';
    if (!confirm(`${action} this post?`)) return;
    this.adminService.hidePost(postId, hidden).subscribe({
      next: updated => {
        this.posts.update(list => list.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
        this.snackBar.open(hidden ? 'Post hidden' : 'Post visible again', 'OK', { duration: 2000 });
        this.loadAll();
      },
      error: () => this.snackBar.open('Could not update post', 'OK', { duration: 3000 })
    });
  }

  deletePost(postId: number): void {
    if (confirm('Delete this post permanently?')) {
      this.adminService.deletePost(postId).subscribe({
        next: () => {
          this.snackBar.open('Post deleted', 'OK', { duration: 2000 });
          this.posts.update(list => list.filter(p => p.id !== postId));
          this.loadAll();
        },
        error: () => this.snackBar.open('Could not delete post', 'OK', { duration: 3000 })
      });
    }
  }

  resolveReport(report: Report, status: 'RESOLVED' | 'DISMISSED'): void {
    if (!confirm(`${status === 'RESOLVED' ? 'Resolve' : 'Dismiss'} this report?`)) return;
    this.adminService.resolveReport(report.id, status).subscribe(() => {
      this.snackBar.open('Report updated', 'OK', { duration: 2000 });
      this.loadAll();
    });
  }

  banReportedUser(report: Report): void {
    const user = report.reportedUser;
    if (!user) return;
    if (!confirm(`Ban user ${user.username}?`)) return;
    this.adminService.banUser(user.id, true).subscribe({
      next: () => {
        this.snackBar.open(`${user.username} banned`, 'OK', { duration: 2000 });
        this.adminService.resolveReport(report.id, 'RESOLVED').subscribe(() => this.loadAll());
      },
      error: () => this.snackBar.open('Could not ban user', 'OK', { duration: 3000 })
    });
  }

  truncate(text: string, max = 80): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
