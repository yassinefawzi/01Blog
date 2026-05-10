import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  profileData: any = null;
  user: any = null;
  isFollowing: boolean = false;
  
  postCount: number = 0;
  followersCount: number = 0;
  followingCount: number = 0;
  userPosts: any[] = [];

  ngOnInit(): void {
    const currentUsername = this.authService.getUsername();
    if (currentUsername) {
      this.loadProfile(currentUsername);
    }
  }

  loadProfile(username: string) {
    this.userService.getProfile(username).subscribe({
      next: (data) => {
        this.profileData = data;
        this.user = { username: data.username }; 
        this.postCount = data.postCount;
        this.followersCount = data.followersCount;
        this.followingCount = data.followingCount;
        this.userPosts = data.posts || [];
      },
      error: (err) => console.error('Error loading profile:', err)
    });
  }

  toggleFollow() {
    if (!this.user || !this.authService.getUsername()) return;

    this.userService.toggleFollow(this.user.username, this.authService.getUsername()!).subscribe({
      next: (res) => {
        this.isFollowing = (res.status === 'followed');
        this.loadProfile(this.user.username);
      }
    });
  }
}