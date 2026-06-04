package com._blog.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationDTO {
	private String partnerUsername;
	private String lastMessage;
	private LocalDateTime lastMessageAt;
	private long unreadCount;
}
