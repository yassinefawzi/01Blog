import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PostService } from '../../../core/services/post.service';
import { detectAllowedMedia, FileService, mediaRejectionMessage, POST_MEDIA_MESSAGE } from '../../../core/services/file.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { MarkdownPipe } from '../../../shared/markdown.pipe';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, RouterLink,
    MarkdownPipe
  ],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private fileService = inject(FileService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private confirm = inject(ConfirmService);

  form = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(5000)]]
  });
  mediaType = 'NONE';
  previewUrl?: string;
  uploading = false;
  submitting = false;
  preview = false;
  private pendingFile?: File;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let kind;
    try {
      kind = await detectAllowedMedia(file, false);
    } catch (err) {
      this.clearMedia();
      this.snackBar.open(mediaRejectionMessage(err, POST_MEDIA_MESSAGE) ?? POST_MEDIA_MESSAGE, 'OK', { duration: 4000 });
      return;
    }
    if (!kind) {
      this.clearMedia();
      this.snackBar.open(POST_MEDIA_MESSAGE, 'OK', { duration: 4000 });
      return;
    }

    this.revokePreview();
    this.pendingFile = file;
    this.mediaType = kind;
    this.previewUrl = URL.createObjectURL(file);
  }

  private clearMedia(): void {
    this.revokePreview();
    this.pendingFile = undefined;
    this.previewUrl = undefined;
    this.mediaType = 'NONE';
  }

  private revokePreview(): void {
    if (this.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.confirm.ask('Publish this post?', 'Publish post', 'Publish').subscribe(ok => {
      if (!ok) return;
      this.publish();
    });
  }

  private uploadOnPublish(file: File): Observable<{ url: string; mediaType: string }> {
    return from(detectAllowedMedia(file, false)).pipe(
      switchMap(kind => {
        if (!kind) {
          return throwError(() => new Error('invalid-media')) as Observable<{ url: string; mediaType: string }>;
        }
        this.uploading = true;
        return this.fileService.upload(file);
      })
    );
  }

  private publish(): void {
    this.submitting = true;
    const description = this.form.value.description!;
    const file = this.pendingFile;

    const uploaded$: Observable<{ url: string; mediaType: string } | null> = file
      ? this.uploadOnPublish(file)
      : of(null);

    uploaded$.pipe(
      switchMap(uploaded => this.postService.createPost({
        description,
        mediaUrl: uploaded?.url,
        mediaType: uploaded?.mediaType ?? 'NONE'
      }))
    ).subscribe({
      next: () => {
        this.snackBar.open('Post published!', 'OK', { duration: 3000 });
        this.router.navigate(['/feed']);
      },
      error: (err: unknown) => {
        this.uploading = false;
        this.submitting = false;
        this.snackBar.open(mediaRejectionMessage(err, POST_MEDIA_MESSAGE) ?? 'Failed to publish', 'OK', { duration: 4000 });
      },
      complete: () => this.submitting = false
    });
  }
}
