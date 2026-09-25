import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, FormsModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon>flag</mat-icon>
      <h2 mat-dialog-title>Report Content</h2>
    </div>
    <mat-dialog-content>
      <p class="dialog-desc">Help us keep 01Blog safe. Describe what's wrong with this content.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reason</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" placeholder="Describe the issue..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" class="btn-pill" [disabled]="!reason.trim()" (click)="submit()">
        Submit Report
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 1.25rem 1.5rem 0;

      mat-icon { color: var(--color-accent); }
      h2 { margin: 0; font-size: 1.125rem; font-weight: 700; padding: 0; }
    }
    .dialog-desc {
      margin: 0 0 1rem;
      color: var(--color-text-muted);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .full-width { width: 100%; }
    mat-dialog-content { padding-top: 0.75rem !important; }
  `]
})
export class ReportDialogComponent {
  reason = '';

  constructor(
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reportedPostId?: number; reportedUserId?: number }
  ) {}

  submit(): void {
    if (!this.reason.trim()) return;
    if (!confirm('Submit this report? Our moderators will review it.')) {
      return;
    }
    this.reportService.createReport({
      reason: this.reason.trim(),
      reportedPostId: this.data.reportedPostId,
      reportedUserId: this.data.reportedUserId
    }).subscribe({
      next: () => {
        this.snackBar.open('Report submitted — thank you', 'OK', { duration: 3000 });
        this.dialogRef.close();
      },
      error: () => this.snackBar.open('Failed to submit report', 'OK', { duration: 3000 })
    });
  }
}
