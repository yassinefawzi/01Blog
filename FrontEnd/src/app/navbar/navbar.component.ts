import { Component, EventEmitter, Output, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PostService } from '../services/post.service';
import { Post } from '../models/post.model';
import { CreatePostComponent } from '../create-post/create-post.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CreatePostComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private postService = inject(PostService);

  isCreateModalOpen: boolean = false;
  newPost = { title: '', content: '' };
  searchQuery: string = '';
  user$ = this.authService.currentUser$;

  @ViewChild(CreatePostComponent) createPostComp!: CreatePostComponent;
  @Output() postAdded = new EventEmitter<Post>();

  posts: Post[] = [];

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  logout() {
    this.authService.logout();
  }

  openCreatePost() {
    console.log('Opening create post modal');
    this.authService.checkAuth(() => {
      this.isCreateModalOpen = true;
      document.body.style.overflow = 'hidden';
    });
  }

  closeCreateModal() {
    if (this.createPostComp) {
      this.isCreateModalOpen = false;
      document.body.style.overflow = 'auto';
    }
  }

  closeCreatePost() {
    this.isCreateModalOpen = false;
    this.newPost = { title: '', content: '' };
    document.body.style.overflow = 'auto';
  }

  onPostCreated(newPost: Post) {
    this.postAdded.emit(newPost);
    this.closeCreateModal();
  }

  submitPost() {
  if (this.newPost.title.trim() && this.newPost.content.trim()) {
    this.postService.createPost(this.newPost as any).subscribe({
      next: (savedPost: Post) => {
        this.postAdded.emit(savedPost);
        this.closeCreatePost();
      },
      error: (err: any) => console.error('Could not save post', err),
    });
  }
}
}
