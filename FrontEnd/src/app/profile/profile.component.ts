import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { PostService } from '../services/post.service';
import { ThemeService } from '../services/themeService';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user.model';
import { Post, Comment } from '../models/post.model';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  postCount: number = 0;
  followersCount: number = 0;
  followingCount: number = 0;
  userPosts: Post[] = [];
  isFollowing: boolean = false;
  isOwnProfile: boolean = false;
  selectedPost: Post | null = null;
  activeCategory: string = 'All';
  darkMode$ = this.themeService.darkMode$;
  editingPostId: number | null = null;
  editContent: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const targetUser = params.get('username') || this.authService.getUsername();
      if (targetUser) {
        this.loadProfile(targetUser);
      }
    });
  }

  isAuthor(post: Post): boolean {
    return this.isOwnProfile;
  }

  startEdit(post: Post) {
    if (!post.id) return;
    this.editingPostId = post.id;
    this.editContent = post.content || '';
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editContent = '';
  }

  saveEdit(post: any) {
    if (!post.id || !this.editContent.trim()) return;
    const updatePayload = {
      content: this.editContent,
      category: post.category,
    };

    this.postService.updatePost(post.id, updatePayload).subscribe({
      next: (updatedPost) => {
        this.userPosts = this.userPosts.map((p) =>
          p.id === post.id ? { ...p, content: updatedPost.content } : p,
        );
        if (this.selectedPost && this.selectedPost.id === post.id) {
          this.selectedPost = {
            ...this.selectedPost,
            content: updatedPost.content,
          };
        }

        this.editingPostId = null;
        this.editContent = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update story:', err);
      },
    });
  }

  deletePost(postId: number | undefined) {
    if (!postId || !confirm('Are you sure you want to delete this story?')) return;
    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.userPosts = this.userPosts.filter((p) => p.id !== postId);
        this.postCount = this.userPosts.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to delete story:', err),
    });
  }

  updateLike(postId: number | undefined) {
    if (!postId) return;
    this.postService.likePost(postId).subscribe({
      next: (updatedPost) => {
        this.syncPostInFeed(postId, updatedPost);
      },
    });
  }

  updateDislike(postId: number | undefined) {
    if (!postId) return;
    this.postService.dislikePost(postId).subscribe({
      next: (updatedPost) => {
        this.syncPostInFeed(postId, updatedPost);
      },
    });
  }

  private syncPostInFeed(postId: number, updatedPost: Post) {
    this.userPosts = this.userPosts.map((post) => {
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
      this.postService.addComment(post.id, { text }).subscribe({
        next: (savedComment: Comment) => {
          const updatedComments = [savedComment, ...(post.comments || [])];
          const updatedPost = {
            ...post,
            comments: updatedComments,
            commentCount: (post.commentCount || 0) + 1,
          };
          this.userPosts = this.userPosts.map((p) => (p.id === post.id ? updatedPost : p));
          if (this.selectedPost && this.selectedPost.id === post.id) {
            this.selectedPost = updatedPost;
          }
          input.value = '';
          this.cdr.detectChanges();
        },
      });
    }
  }

  deleteComment(commentId: number | undefined) {
    if (!this.selectedPost?.id || !commentId || !confirm('Delete this comment permanently?'))
      return;
    this.postService.deleteComment(this.selectedPost.id, commentId).subscribe({
      next: () => {
        const updatedComments = (this.selectedPost!.comments || []).filter(
          (c) => c.id !== commentId,
        );
        this.selectedPost = {
          ...this.selectedPost!,
          comments: updatedComments,
          commentCount: Math.max(0, (this.selectedPost!.commentCount || 1) - 1),
        };
        this.userPosts = this.userPosts.map((p) =>
          p.id === this.selectedPost?.id ? this.selectedPost! : p,
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to remove comment:', err),
    });
  }

  isCommentAuthor(comment: Comment): boolean {
    const currentUsername = this.authService.getUsername();
    const authorName =
      typeof comment.author === 'object' ? comment.author?.username : comment.author;
    return authorName === currentUsername;
  }

  loadProfile(username: string) {
	console.log('Loading profile for:', username);
    this.userService.getProfile(username).subscribe({
      next: (data: any) => {
        this.user = data;
        this.userPosts = data.posts || [];
        this.postCount = this.userPosts.length;
        this.followersCount = data.followersCount || 0;
        this.followingCount = data.followingCount || 0;
        this.isFollowing = data.isFollowing || false;
        const currentUsername = this.authService.getUsername();
        this.isOwnProfile = currentUsername === data.username;

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading profile:', err),
    });
  }

  onPostAdded(newPost: Post) {
    if (this.isOwnProfile) {
      this.userPosts.unshift(newPost);
      this.postCount = this.userPosts.length;
      this.cdr.detectChanges();
    }
  }

  handleCategoryChange(category: string) {
    this.activeCategory = category;
    if (category === 'All') {
      this.userPosts = this.user?.posts || [];
    } else {
      this.userPosts = (this.user?.posts || []).filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase(),
      );
    }
    this.cdr.detectChanges();
  }

  toggleFollow() {
    const targetUsername = this.user?.username;
    if (!targetUsername || this.isOwnProfile) return;

    this.userService.toggleFollow(targetUsername).subscribe({
      next: (res: any) => {
        this.isFollowing = res.isFollowing;
        this.followersCount += this.isFollowing ? 1 : -1;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Follow toggle operation failed:', err),
    });
  }
}
