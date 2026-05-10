import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  postCount: number = 0;
  followersCount: number = 0;
  followingCount: number = 0;
  userPosts: any[] = [];
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
      next: (data: any) => {
        // Map the DTO data back to the individual variables your HTML uses
        this.user = data; // So {{ user.username }} works
        this.postCount = data.postCount || 0;
        this.followersCount = data.followerCount || 0;
        this.followingCount = data.followingCount || 0;
        this.userPosts = data.recentPosts || [];
        this.isFollowing = data.isFollowing || false;

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading profile:', err);
      },
    });
  }

  toggleFollow() {
    if (!this.user || !this.authService.getUsername()) return;
    this.userService.toggleFollow(this.user.username).subscribe({
      next: (res: any) => {
        this.isFollowing = res.status === 'followed';
        this.loadProfile(this.user.username);
      },
      error: (err: any) => console.error('Follow toggle failed', err),
    });
  }
}
