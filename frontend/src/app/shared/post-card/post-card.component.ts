import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Comment, Post } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { FileService } from '../../core/services/file.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { MarkdownPipe } from '../markdown.pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, FormsModule, DatePipe, UpperCasePipe,
    MatSnackBarModule, MatProgressSpinnerModule, MarkdownPipe
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input() showComments = true;
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<number>();

  private snackBar = inject(MatSnackBar);
  private fileService = inject(FileService);

  commentText = '';
  showCommentBox = false;
  commentsLoading = false;
  editing = false;
  editDescription = '';
  editMediaUrl?: string;
  editMediaType = 'NONE';
  editPreviewUrl?: string;
  saving = false;
  uploading = false;
  editPreview = false;

  constructor(
    public auth: AuthService,
    private postService: PostService,
    private dialog: MatDialog
  ) {}

  toggleLike(): void {
    this.postService.toggleLike(this.post.id).subscribe(res => {
      this.post = { ...this.post, likedByCurrentUser: res.liked, likesCount: res.likesCount };
      this.postUpdated.emit(this.post);
    });
  }

  toggleComments(): void {
    this.showCommentBox = !this.showCommentBox;
    if (!this.showCommentBox) return;
    this.commentsLoading = true;
    this.postService.getComments(this.post.id).subscribe({
      next: comments => {
        this.post = { ...this.post, comments, commentsCount: comments.length };
        this.commentsLoading = false;
        this.postUpdated.emit(this.post);
      },
      error: () => this.commentsLoading = false
    });
  }

  submitComment(): void {
    if (!this.commentText.trim()) return;
    this.postService.addComment(this.post.id, this.commentText.trim()).subscribe(comment => {
      const comments = [...(this.post.comments || []), comment];
      this.post = { ...this.post, comments, commentsCount: this.post.commentsCount + 1 };
      this.commentText = '';
      this.postUpdated.emit(this.post);
    });
  }

  deleteComment(comment: Comment): void {
    if (!confirm('Delete this comment?')) return;
    this.postService.deleteComment(this.post.id, comment.id).subscribe({
      next: () => {
        const comments = (this.post.comments || []).filter(c => c.id !== comment.id);
        this.post = { ...this.post, comments, commentsCount: comments.length };
        this.postUpdated.emit(this.post);
      },
      error: () => this.snackBar.open('Failed to delete comment', 'OK', { duration: 3000 })
    });
  }

  isCommentOwner(comment: Comment): boolean {
    return this.auth.currentUser()?.id === comment.author.id;
  }

  startEdit(): void {
    this.editing = true;
    this.editDescription = this.post.description;
    this.editMediaUrl = this.post.mediaUrl;
    this.editMediaType = this.post.mediaType || 'NONE';
    this.editPreviewUrl = this.post.mediaUrl;
    this.editPreview = false;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editDescription = '';
    this.editPreview = false;
    this.editPreviewUrl = undefined;
    this.uploading = false;
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.editPreviewUrl = URL.createObjectURL(file);
    this.uploading = true;
    this.fileService.upload(file).subscribe({
      next: res => {
        this.editMediaUrl = res.url;
        this.editMediaType = res.mediaType;
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Upload failed', 'OK', { duration: 3000 });
      }
    });
  }

  removeEditMedia(): void {
    this.editMediaUrl = undefined;
    this.editMediaType = 'NONE';
    this.editPreviewUrl = undefined;
  }

  saveEdit(): void {
    if (!this.editDescription.trim()) return;
    this.saving = true;
    this.postService.updatePost(this.post.id, {
      description: this.editDescription.trim(),
      mediaUrl: this.editMediaUrl ?? null,
      mediaType: this.editMediaType
    }).subscribe({
      next: updated => {
        this.post = { ...this.post, ...updated };
        this.editing = false;
        this.saving = false;
        this.postUpdated.emit(this.post);
        this.snackBar.open('Post updated', 'OK', { duration: 2000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to update post', 'OK', { duration: 3000 });
      }
    });
  }

  deletePost(): void {
    if (confirm('Delete this post?')) {
      this.postService.deletePost(this.post.id, this.post.author.username).subscribe(() => this.postDeleted.emit(this.post.id));
    }
  }

  openReport(): void {
    this.dialog.open(ReportDialogComponent, {
      width: '400px',
      data: { reportedPostId: this.post.id }
    });
  }

  isOwner(): boolean {
    return this.auth.currentUser()?.id === this.post.author.id;
  }
}
