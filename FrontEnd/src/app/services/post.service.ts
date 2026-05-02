import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Comment } from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:8080/api/posts';
  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  createPost(post: Post, file?: File): Observable<Post> {
    const formData = new FormData();
    formData.append('post', new Blob([JSON.stringify(post)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<Post>(this.apiUrl, formData);
  }

  updatePost(postId: number, postDetails: { content: string; category: string }): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, postDetails);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }

  addComment(postId: number, comment: Partial<Comment>): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment);
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`);
  }

  likePost(postId: number): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}/like`, {});
  }

  dislikePost(postId: number): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}/dislike`, {});
  }
}
