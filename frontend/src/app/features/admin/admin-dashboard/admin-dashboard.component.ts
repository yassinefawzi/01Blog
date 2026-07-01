import { Component, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStats, Report, User } from '../../../core/models';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatTabsModule, DatePipe, UpperCasePipe, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  users = signal<User[]>([]);
  reports = signal<Report[]>([]);

  userColumns = ['username', 'email', 'role', 'actions'];
  reportColumns = ['reporter', 'reason', 'status', 'createdAt', 'actions'];

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.adminService.getStats().subscribe(s => this.stats.set(s));
    this.adminService.getUsers().subscribe(r => this.users.set(r.content));
    this.adminService.getReports().subscribe(r => this.reports.set(r.content));
  }

  banUser(user: User): void {
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
    if (confirm(`Delete user ${user.username}?`)) {
      this.adminService.deleteUser(user.id).subscribe(() => {
        this.snackBar.open('User deleted', 'OK', { duration: 2000 });
        this.loadAll();
      });
    }
  }

  deletePost(postId: number): void {
    if (confirm('Delete this post?')) {
      this.adminService.deletePost(postId).subscribe(() => {
        this.snackBar.open('Post deleted', 'OK', { duration: 2000 });
      });
    }
  }

  resolveReport(report: Report, status: 'RESOLVED' | 'DISMISSED'): void {
    this.adminService.resolveReport(report.id, status).subscribe(() => {
      this.snackBar.open('Report updated', 'OK', { duration: 2000 });
      this.loadAll();
    });
  }
}
