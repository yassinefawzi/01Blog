import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Post } from '../models/post.model';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  searchQuery: string = '';
  posts: Post[] = [];
  selectedPost: Post | null = null;

  constructor(
    private router: Router,
    private postService: PostService,
  ) {}
  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: (err) => {
        console.error('Error fetching posts:', err);
      },
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

  addComment(post: Post, event: any) {
    const text = event.target.value.trim();
    if (text && post.id) {
      const newComment = {
        author: 'Current User',
        text: text,
      };
      this.postService.addComment(post.id, newComment).subscribe({
        next: (savedComment) => {
          post.comments.push(savedComment);
          event.target.value = '';
        },
        error: (err) => {
          console.error('Error adding comment:', err);
        },
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
