import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Post } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { MatDialog } from '@angular/material/dialog';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, FormsModule, DatePipe, UpperCasePipe
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input() showComments = true;
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<number>();

  commentText = '';
  showCommentBox = false;

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

  submitComment(): void {
    if (!this.commentText.trim()) return;
    this.postService.addComment(this.post.id, this.commentText.trim()).subscribe(comment => {
      const comments = [...(this.post.comments || []), comment];
      this.post = { ...this.post, comments, commentsCount: this.post.commentsCount + 1 };
      this.commentText = '';
      this.postUpdated.emit(this.post);
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
