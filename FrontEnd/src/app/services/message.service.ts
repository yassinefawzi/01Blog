import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrivateMessage {
  id: number;
  senderUsername: string;
  recipientUsername: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  partnerUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = 'http://localhost:8080/api/messages';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`, { withCredentials: true });
  }

  getConversation(username: string): Observable<PrivateMessage[]> {
    return this.http.get<PrivateMessage[]>(`${this.apiUrl}/conversation/${username}`, {
      withCredentials: true,
    });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`, { withCredentials: true });
  }

  markAsRead(username: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/conversation/${username}/read`, {}, {
      withCredentials: true,
    });
  }

  sendMessage(recipientUsername: string, content: string): Observable<PrivateMessage> {
    return this.http.post<PrivateMessage>(
      `${this.apiUrl}/send`,
      { recipientUsername, content },
      { withCredentials: true },
    );
  }
}
