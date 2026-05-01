import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Post, Comment } from '../models/post.model';
import { PostService } from '../services/post.service';
import { AuthService } from '../services/auth.service';
import { CreatePostComponent } from '../create-post/create-post.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CreatePostComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  searchQuery: string = '';
  posts: Post[] = [];
  selectedPost: Post | null = null;
  isCreateModalOpen: boolean = false;
  newPost = { title: '', content: '', author: 'Current User' };

  constructor(
    private router: Router,
    private postService: PostService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data.map(post => {
        if (post.comments) {
          post.comments.sort((a, b) => {
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
        return post;
      });
        this.posts.sort((a, b) => {
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching posts:', err);
      },
    });
  }
  openCreatePost() {
    this.authService.checkAuth(() => {
      this.isCreateModalOpen = true;
      document.body.style.overflow = 'hidden';
    });
  }

  handlePostCreated(newPost: Post) {
    this.posts.unshift(newPost);
    this.closeCreateModal();
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  closeCreatePost() {
    this.isCreateModalOpen = false;
    this.newPost = { title: '', content: '', author: 'Current User' };
    document.body.style.overflow = 'auto';
  }

  submitPost() {
    if (this.newPost.title.trim() && this.newPost.content.trim()) {
      this.postService.createPost(this.newPost as Post).subscribe({
        next: (savedPost) => {
          this.posts.unshift(savedPost);
          this.closeCreatePost();
        },
        error: (err) => console.error('Could not save post', err),
      });
    }
  }

  updateLike(postId: number) {
    this.postService.likePost(postId).subscribe({
      next: (updatedPost) => {
        this.posts = this.posts.map((post) => {
          if (post.id === postId) {
            const freshData = { ...post, likes: updatedPost.likes, dislikes: updatedPost.dislikes };
            if (this.selectedPost?.id === postId) {
              this.selectedPost = freshData;
            }
            return freshData;
          }
          return post;
        });
        this.cdr.detectChanges();
      },
    });
  }

  updateDislike(postId: number) {
    this.postService.dislikePost(postId).subscribe({
      next: (updatedPost) => {
        this.posts = this.posts.map((post) => {
          if (post.id === postId) {
            const freshData = { ...post, likes: updatedPost.likes, dislikes: updatedPost.dislikes };
            if (this.selectedPost && this.selectedPost.id === postId) {
              this.selectedPost = freshData;
            }
            return freshData;
          }
          return post;
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating dislike:', err),
    });
  }

  openComments(post: Post) {
    this.selectedPost = post;
    document.body.style.overflow = 'hidden';
  }

  closeComments() {
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  addComment(post: Post, input: HTMLInputElement) {
    const text = input.value.trim();

    if (text && post.id) {
      const newComment: any = { text: text };

      this.postService.addComment(post.id, newComment).subscribe({
        next: (savedComment: Comment) => {
          const updatedComments = [savedComment, ...(post.comments || [])];
          const updatedPost = {
            ...post,
            comments: updatedComments,
            commentCount: (post.commentCount || 0) + 1,
          };
          this.posts = this.posts.map((p) => (p.id === post.id ? updatedPost : p));

          if (this.selectedPost && this.selectedPost.id === post.id) {
            this.selectedPost = updatedPost;
          }
          input.value = '';
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to add comment', err),
      });
    }
  }

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
