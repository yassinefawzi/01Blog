package com._blog.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
	private Long id;
	private String message;
	private boolean read;
	private LocalDateTime createdAt;
	private Long relatedPostId;
}
