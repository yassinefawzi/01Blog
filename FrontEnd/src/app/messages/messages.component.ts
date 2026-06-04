import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import {
  Conversation,
  MessageService,
  PrivateMessage,
} from '../services/message.service';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private websocketService = inject(WebsocketService);

  conversations: Conversation[] = [];
  messages: PrivateMessage[] = [];
  activePartner: string | null = null;
  newMessage = '';
  currentUsername: string | null = null;

  private subs = new Subscription();

  ngOnInit(): void {
    this.currentUsername = this.authService.getUsername();
    this.loadConversations();

    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const partner = params.get('username');
        if (partner) {
          this.openConversation(partner);
        }
      }),
    );

    this.subs.add(
      this.websocketService.incomingMessage$.subscribe((msg) => {
        this.handleIncomingMessage(msg);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadConversations() {
    this.messageService.getConversations().subscribe({
      next: (data) => (this.conversations = data),
    });
  }

  openConversation(username: string) {
    this.activePartner = username;
    this.router.navigate(['/messages', username], { replaceUrl: true });
    this.messageService.getConversation(username).subscribe({
      next: (data) => {
        this.messages = data;
        this.messageService.markAsRead(username).subscribe({
          next: () => this.loadConversations(),
        });
      },
    });
  }

  startNewConversation(username: string) {
    if (!username.trim() || username === this.currentUsername) return;
    this.openConversation(username.trim());
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content || !this.activePartner) return;

    const sent = this.websocketService.sendChatMessage(this.activePartner, content);
    if (!sent) {
      this.messageService.sendMessage(this.activePartner, content).subscribe({
        next: (msg) => this.appendMessage(msg),
      });
    }
    this.newMessage = '';
  }

  isMine(msg: PrivateMessage): boolean {
    return msg.senderUsername === this.currentUsername;
  }

  private handleIncomingMessage(msg: PrivateMessage) {
    const partner =
      msg.senderUsername === this.currentUsername
        ? msg.recipientUsername
        : msg.senderUsername;

    if (this.activePartner === partner) {
      const exists = this.messages.some((m) => m.id === msg.id);
      if (!exists) {
        this.appendMessage(msg);
        if (msg.recipientUsername === this.currentUsername) {
          this.messageService.markAsRead(partner).subscribe();
        }
      }
    }
    this.loadConversations();
  }

  private appendMessage(msg: PrivateMessage) {
    this.messages = [...this.messages, msg];
  }
}
