import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  private subscription: { unsubscribe: () => void } | null = null;

  connect<T>(topic: string, onMessage: (payload: T) => void): void {
    this.disconnect();

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.subscription = this.client!.subscribe(topic, (message: IMessage) => {
          onMessage(JSON.parse(message.body) as T);
        });
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
  }
}
