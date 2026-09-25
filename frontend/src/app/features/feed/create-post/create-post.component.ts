import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PostService } from '../../../core/services/post.service';
import { FileService } from '../../../core/services/file.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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

  form = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(5000)]]
  });
  mediaUrl?: string;
  mediaType = 'NONE';
  previewUrl?: string;
  uploading = false;
  submitting = false;
  preview = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.previewUrl = URL.createObjectURL(file);
    this.uploading = true;
    this.fileService.upload(file).subscribe({
      next: res => {
        this.mediaUrl = res.url;
        this.mediaType = res.mediaType;
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Upload failed', 'OK', { duration: 3000 });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    if (!confirm('Publish this post?')) return;
    this.submitting = true;
    this.postService.createPost({
      description: this.form.value.description!,
      mediaUrl: this.mediaUrl,
      mediaType: this.mediaType
    }).subscribe({
      next: () => {
        this.snackBar.open('Post published!', 'OK', { duration: 3000 });
        this.router.navigate(['/feed']);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to publish', 'OK', { duration: 3000 });
      },
      complete: () => this.submitting = false
    });
  }
}
