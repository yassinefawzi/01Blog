package com._blog.service;

import com._blog.dto.NotificationDTO;
import com._blog.dto.PrivateMessageDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketEventPublisher {

	private final SimpMessagingTemplate messagingTemplate;

	public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	public void sendPrivateMessage(String username, PrivateMessageDTO message) {
		messagingTemplate.convertAndSendToUser(username, "/queue/messages", message);
	}

	public void sendNotification(String username, NotificationDTO notification) {
		messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
	}

	public void sendCommentUpdate(Long postId, Object commentPayload) {
		messagingTemplate.convertAndSend("/topic/post." + postId + ".comments", commentPayload);
	}
}
