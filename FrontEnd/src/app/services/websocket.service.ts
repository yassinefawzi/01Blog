import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { PrivateMessage } from './message.service';
import { AppNotification } from './notification.service';

const WS_URL = 'ws://localhost:8080/ws';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private platformId = inject(PLATFORM_ID);
  private client: Client | null = null;

  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();

  private messageSubject = new Subject<PrivateMessage>();
  incomingMessage$ = this.messageSubject.asObservable();

  private notificationSubject = new Subject<AppNotification>();
  incomingNotification$ = this.notificationSubject.asObservable();

  private commentSubject = new Subject<{ postId: number; comment: unknown }>();
  incomingComment$ = this.commentSubject.asObservable();

  private postSubscriptions = new Map<number, string>();

  connect(token: string): void {
    if (!isPlatformBrowser(this.platformId) || !token) return;
    this.disconnect();

    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connectedSubject.next(true);
        this.subscribeUserQueues();
      },
      onDisconnect: () => this.connectedSubject.next(false),
      onStompError: () => this.connectedSubject.next(false),
      onWebSocketError: () => this.connectedSubject.next(false),
    });

    this.client.activate();
  }

  disconnect(): void {
    this.postSubscriptions.forEach((subId) => this.client?.unsubscribe(subId));
    this.postSubscriptions.clear();
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
    this.connectedSubject.next(false);
  }

  isConnected(): boolean {
    return !!this.client?.connected;
  }

  sendChatMessage(recipientUsername: string, content: string): boolean {
    if (!this.client?.connected) return false;
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ recipientUsername, content }),
    });
    return true;
  }

  subscribeToPostComments(postId: number): void {
    if (!this.client?.connected || this.postSubscriptions.has(postId)) return;
    const sub = this.client.subscribe(`/topic/post.${postId}.comments`, (message: IMessage) => {
      try {
        const comment = JSON.parse(message.body);
        this.commentSubject.next({ postId, comment });
      } catch {
        /* ignore malformed payloads */
      }
    });
    this.postSubscriptions.set(postId, sub.id);
  }

  unsubscribeFromPostComments(postId: number): void {
    const subId = this.postSubscriptions.get(postId);
    if (subId && this.client) {
      this.client.unsubscribe(subId);
      this.postSubscriptions.delete(postId);
    }
  }

  private subscribeUserQueues(): void {
    if (!this.client) return;

    this.client.subscribe('/user/queue/messages', (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as PrivateMessage;
        this.messageSubject.next(payload);
      } catch {
        /* ignore */
      }
    });

    this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as AppNotification;
        this.notificationSubject.next(payload);
      } catch {
        /* ignore */
      }
    });
  }
}
