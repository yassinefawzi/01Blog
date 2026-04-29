import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/post.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
})
export class CreatePostComponent {
  @Output() postCreated = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  newPost = { title: '', content: '', author: '' };

  constructor(
    private postService: PostService,
    private authService: AuthService,
  ) {}

  submit() {
    this.newPost.author = this.authService.getUsername();

    if (this.newPost.title.trim() && this.newPost.content.trim()) {
      this.postService.createPost(this.newPost as any).subscribe({
        next: (savedPost) => {
          this.postCreated.emit(savedPost);
          this.close.emit();
        },
        error: (err) => {
          console.error('Failed to create post:', err);
          if (err.status === 401 || err.status === 403) {
            alert('Session expired. Please login again.');
            this.authService.logout();
          } else {
            alert('An unexpected error occurred. Please try again.');
          }
        },
      });
    }
  }

  cancel() {
    this.close.emit();
  }
}
