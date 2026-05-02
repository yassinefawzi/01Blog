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
  newPost = { 
    title: '', 
    content: '', 
    author: '', 
    category: 'General' 
  };

  selectedFile: File | null = null;
  fileError: string = '';

  constructor(
    private postService: PostService,
    private authService: AuthService,
  ) {}
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        this.fileError = 'File is too large (max 1MB)';
        this.selectedFile = null;
      } else {
        this.fileError = '';
        this.selectedFile = file;
      }
    }
  }

  submit() {
	if (!this.authService.isLoggedIn()) {
	  alert('You must be logged in to create a post.');
	  return;
	}
    this.newPost.author = this.authService.getUsername() || 'Unknown User';
    if (this.newPost.title.trim() && this.newPost.content.trim() && !this.fileError) {
      this.postService.createPost(this.newPost as any, this.selectedFile || undefined).subscribe({
        next: (savedPost) => {
          this.postCreated.emit(savedPost);
          this.close.emit();
        },
        error: (err) => {
          console.error('Failed to create post:', err);
          if (err.status === 401 || err.status === 403) {
            alert('Session expired. Please login again.');
            this.authService.logout();
          } else if (err.status === 413) {
            alert('File is too large for the server.');
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