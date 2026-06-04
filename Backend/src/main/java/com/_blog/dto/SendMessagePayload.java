package com._blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessagePayload {
	@NotBlank
	private String recipientUsername;
	@NotBlank
	private String content;
}
