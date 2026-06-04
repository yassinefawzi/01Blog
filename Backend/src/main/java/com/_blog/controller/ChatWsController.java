package com._blog.controller;

import com._blog.dto.PrivateMessageDTO;
import com._blog.dto.SendMessagePayload;
import com._blog.service.PrivateMessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWsController {

	private final PrivateMessageService privateMessageService;

	public ChatWsController(PrivateMessageService privateMessageService) {
		this.privateMessageService = privateMessageService;
	}

	@MessageMapping("/chat.send")
	public void sendMessage(@Payload SendMessagePayload payload, Principal principal) {
		if (principal == null) {
			throw new IllegalStateException("Unauthenticated WebSocket session");
		}
		privateMessageService.sendMessage(
				principal.getName(),
				payload.getRecipientUsername(),
				payload.getContent());
	}
}
