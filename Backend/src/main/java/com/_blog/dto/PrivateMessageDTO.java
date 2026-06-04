package com._blog.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PrivateMessageDTO {
	private Long id;
	private String senderUsername;
	private String recipientUsername;
	private String content;
	private LocalDateTime sentAt;
	private boolean read;
}
