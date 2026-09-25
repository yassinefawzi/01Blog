import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models';
import { PostCardComponent } from '../../../shared/post-card/post-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [PostCardComponent, MatProgressSpinnerModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page-shell">
      <div class="page-container">
        <a mat-button routerLink="/feed" class="back-link">
          <mat-icon>arrow_back</mat-icon> Back
        </a>

        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="44"></mat-spinner></div>
        } @else {
          @if (post(); as p) {
            @if (p.hidden) {
              <div class="hidden-banner">
                <mat-icon>visibility_off</mat-icon>
                This post is hidden from the feed
              </div>
            }
            <app-post-card [post]="p" (postUpdated)="post.set($event)" (postDeleted)="onDeleted()" />
          } @else {
            <div class="state-box">
              <mat-icon>article</mat-icon>
              <h3>Post not found</h3>
              <p>It may have been deleted or hidden.</p>
              <a mat-flat-button color="primary" routerLink="/feed" class="btn-pill">Go to feed</a>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .back-link {
      margin-bottom: 1rem;
      color: var(--color-text-muted);
    }
    .hidden-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      background: rgba(234, 88, 12, 0.12);
      color: #ea580c;
      font-size: 0.875rem;
      font-weight: 600;
    }
  `]
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  loading = signal(true);

  constructor(private route: ActivatedRoute, private postService: PostService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.postService.getPost(id).subscribe({
        next: (p: Post) => {
          this.post.set(p);
          this.loading.set(false);
        },
        error: () => {
          this.post.set(null);
          this.loading.set(false);
        }
      });
    });
  }

  onDeleted(): void {
    this.post.set(null);
  }
}
