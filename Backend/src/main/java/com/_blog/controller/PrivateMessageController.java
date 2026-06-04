package com._blog.controller;

import com._blog.dto.ConversationDTO;
import com._blog.dto.PrivateMessageDTO;
import com._blog.dto.SendMessagePayload;
import com._blog.service.PrivateMessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class PrivateMessageController {

	private final PrivateMessageService privateMessageService;

	public PrivateMessageController(PrivateMessageService privateMessageService) {
		this.privateMessageService = privateMessageService;
	}

	@GetMapping("/conversations")
	public ResponseEntity<List<ConversationDTO>> getConversations(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		return ResponseEntity.ok(privateMessageService.getConversations(principal.getName()));
	}

	@GetMapping("/conversation/{username}")
	public ResponseEntity<List<PrivateMessageDTO>> getConversation(
			@PathVariable String username,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		return ResponseEntity.ok(privateMessageService.getConversation(principal.getName(), username));
	}

	@GetMapping("/unread-count")
	public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		long count = privateMessageService.getTotalUnreadCount(principal.getName());
		return ResponseEntity.ok(Map.of("count", count));
	}

	@PutMapping("/conversation/{username}/read")
	public ResponseEntity<?> markAsRead(@PathVariable String username, Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		privateMessageService.markConversationAsRead(principal.getName(), username);
		return ResponseEntity.ok(Map.of("message", "Conversation marked as read"));
	}

	@PostMapping("/send")
	public ResponseEntity<PrivateMessageDTO> sendViaRest(
			@Valid @RequestBody SendMessagePayload payload,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		PrivateMessageDTO sent = privateMessageService.sendMessage(
				principal.getName(),
				payload.getRecipientUsername(),
				payload.getContent());
		return ResponseEntity.status(HttpStatus.CREATED).body(sent);
	}
}
