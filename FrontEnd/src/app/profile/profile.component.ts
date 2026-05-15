import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { User } from '../models/user.model';
import { Post } from '../models/post.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  postCount: number = 0;
  followersCount: number = 0;
  followingCount: number = 0;
  userPosts: Post[] = [];
  isFollowing: boolean = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username') || this.authService.getUsername();
      if (username) {
        this.loadProfile(username);
      }
    });
  }

  loadProfile(username: string) {
    this.userService.getProfile(username).subscribe({
      next: (data: User) => {
        console.log('FULL DATA RECEIVED:', data);
        this.user = data;
        this.userPosts = data.posts || [];
        this.postCount = this.userPosts.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err),
    });
  }
  toggleFollow() {
    const currentUsername = this.user?.username;
    if (!currentUsername || !this.authService.getUsername()) return;

    this.userService.toggleFollow(currentUsername).subscribe({
      next: (res: any) => {
        this.isFollowing = res.status === 'followed';
        this.loadProfile(currentUsername);
      },
      error: (err: any) => console.error('Follow toggle failed', err),
    });
  }
}
