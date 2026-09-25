import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models';
import { PostCardComponent } from '../../shared/post-card/post-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, MatProgressSpinnerModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit, OnDestroy {
  posts = signal<Post[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  page = 0;
  last = false;

  private sentinelEl?: ElementRef<HTMLElement>;
  private observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) this.loadMore();
  }, { rootMargin: '320px' });

  @ViewChild('sentinel')
  set sentinel(el: ElementRef<HTMLElement> | undefined) {
    if (this.sentinelEl) this.observer.unobserve(this.sentinelEl.nativeElement);
    this.sentinelEl = el;
    if (el) this.observer.observe(el.nativeElement);
  }

  constructor(private postService: PostService) {}

  ngOnDestroy(): void {
    this.observer.disconnect();
  }

  ngOnInit(): void {
    this.loadFeed();
  }

  loadFeed(): void {
    this.loading.set(true);
    this.postService.getFeed(0, 10).subscribe({
      next: res => {
        this.posts.set(res.content);
        this.page = 0;
        this.last = res.last;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMore(): void {
    if (this.last || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.postService.getFeed(this.page + 1, 10).subscribe({
      next: res => {
        this.posts.update(p => [...p, ...res.content]);
        this.page = res.page;
        this.last = res.last;
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
    });
  }

  onPostUpdated(post: Post): void {
    this.posts.update(list => list.map(p => p.id === post.id ? post : p));
  }

  onPostDeleted(id: number): void {
    this.posts.update(list => list.filter(p => p.id !== id));
  }
}
