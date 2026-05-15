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

  createPost(post: any, file?: File): Observable<Post> {
    const { author, ...postData } = post;

    const formData = new FormData();
    formData.append('post', new Blob([JSON.stringify(postData)], { type: 'application/json' }));

    if (file) {
      formData.append('file', file);
    }

    return this.http.post<Post>(this.apiUrl, formData, { withCredentials: true });
  }

  updatePost(postId: number, postDetails: { content: string; category: string }): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, postDetails, { withCredentials: true });
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`, { withCredentials: true });
  }

  addComment(postId: number, comment: Partial<Comment>): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment, {
      withCredentials: true,
    });
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`, {
      withCredentials: true,
    });
  }

  likePost(postId: number): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}/like`, {}, { withCredentials: true });
  }

  dislikePost(postId: number): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}/dislike`, {}, { withCredentials: true });
  }

  getSocialFeed(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/feed`, { withCredentials: true });
  }
}
