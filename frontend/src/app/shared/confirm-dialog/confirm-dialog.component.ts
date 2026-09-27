import { Component, Inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" class="btn-pill" [mat-dialog-close]="true">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { margin: 0; font-weight: 700; }
    p { margin: 0; color: var(--color-text-muted); line-height: 1.5; }
    mat-dialog-content { padding-top: 0.5rem !important; }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private dialog: MatDialog) {}

  ask(message: string, title = 'Please confirm', confirmLabel = 'Confirm'): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message, confirmLabel }
    }).afterClosed().pipe(map(result => result === true));
  }
}
