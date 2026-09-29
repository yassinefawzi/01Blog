import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
import { detectAllowedMedia, FileService, mediaRejectionMessage, POST_MEDIA_MESSAGE } from '../../core/services/file.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { ConfirmService } from '../confirm-dialog/confirm-dialog.component';
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
  private editFile?: File;
  editPreview = false;

  constructor(
    public auth: AuthService,
    private postService: PostService,
    private dialog: MatDialog,
    private confirm: ConfirmService
  ) {}

  toggleLike(): void {
    if (this.post.hidden) return;
    this.postService.toggleLike(this.post.id).subscribe(res => {
      this.post = { ...this.post, likedByCurrentUser: res.liked, likesCount: res.likesCount };
      this.postUpdated.emit(this.post);
    });
  }

  toggleComments(): void {
    if (this.post.hidden) return;
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
    if (this.post.hidden || !this.commentText.trim()) return;
    this.postService.addComment(this.post.id, this.commentText.trim()).subscribe(comment => {
      const comments = [...(this.post.comments || []), comment];
      this.post = { ...this.post, comments, commentsCount: this.post.commentsCount + 1 };
      this.commentText = '';
      this.postUpdated.emit(this.post);
    });
  }

  deleteComment(comment: Comment): void {
    if (this.post.hidden) return;
    this.confirm.ask('Delete this comment?', 'Delete comment', 'Delete').subscribe(ok => {
      if (!ok) return;
      this.removeComment(comment);
    });
  }

  private removeComment(comment: Comment): void {
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
    if (this.post.hidden) return;
    this.editing = true;
    this.editDescription = this.post.description;
    this.editMediaUrl = this.post.mediaUrl;
    this.editMediaType = this.post.mediaType || 'NONE';
    this.editPreviewUrl = this.post.mediaUrl;
    this.editFile = undefined;
    this.editPreview = false;
  }

  cancelEdit(): void {
    this.revokeEditPreview();
    this.editing = false;
    this.editDescription = '';
    this.editPreview = false;
    this.editPreviewUrl = undefined;
    this.editFile = undefined;
    this.uploading = false;
  }

  async onEditFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let kind;
    try {
      kind = await detectAllowedMedia(file, false);
    } catch (err) {
      this.snackBar.open(mediaRejectionMessage(err, POST_MEDIA_MESSAGE) ?? POST_MEDIA_MESSAGE, 'OK', { duration: 4000 });
      return;
    }
    if (!kind) {
      this.snackBar.open(POST_MEDIA_MESSAGE, 'OK', { duration: 4000 });
      return;
    }

    this.revokeEditPreview();
    this.editFile = file;
    this.editMediaType = kind;
    this.editPreviewUrl = URL.createObjectURL(file);
  }

  removeEditMedia(): void {
    this.revokeEditPreview();
    this.editFile = undefined;
    this.editMediaUrl = undefined;
    this.editMediaType = 'NONE';
    this.editPreviewUrl = undefined;
  }

  private uploadOnSave(file: File): Observable<{ url: string; mediaType: string }> {
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

  private revokeEditPreview(): void {
    if (this.editPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.editPreviewUrl);
    }
  }

  saveEdit(): void {
    if (!this.editDescription.trim()) return;
    this.saving = true;
    const description = this.editDescription.trim();
    const file = this.editFile;

    const uploaded$: Observable<{ url: string; mediaType: string } | null> = file
      ? this.uploadOnSave(file)
      : of(null);

    uploaded$.pipe(
      switchMap(uploaded => this.postService.updatePost(this.post.id, {
        description,
        mediaUrl: uploaded ? uploaded.url : (this.editMediaUrl ?? null),
        mediaType: uploaded ? uploaded.mediaType : this.editMediaType
      }))
    ).subscribe({
      next: updated => {
        this.revokeEditPreview();
        this.editFile = undefined;
        this.uploading = false;
        this.post = { ...this.post, ...updated };
        this.editing = false;
        this.saving = false;
        this.postUpdated.emit(this.post);
        this.snackBar.open('Post updated', 'OK', { duration: 2000 });
      },
      error: (err: unknown) => {
        this.uploading = false;
        this.saving = false;
        this.snackBar.open(mediaRejectionMessage(err, POST_MEDIA_MESSAGE) ?? 'Failed to update post', 'OK', { duration: 4000 });
      }
    });
  }

  deletePost(): void {
    this.confirm.ask('Delete this post?', 'Delete post', 'Delete').subscribe(ok => {
      if (!ok) return;
      this.postService.deletePost(this.post.id, this.post.author.username).subscribe(() => this.postDeleted.emit(this.post.id));
    });
  }

  openReport(): void {
    if (this.post.hidden) return;
    this.dialog.open(ReportDialogComponent, {
      width: '400px',
      data: { reportedPostId: this.post.id }
    });
  }

  isOwner(): boolean {
    return this.auth.currentUser()?.id === this.post.author.id;
  }
}
