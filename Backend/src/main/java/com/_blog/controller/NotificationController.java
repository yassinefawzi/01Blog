package com._blog.controller;

import com._blog.dto.NotificationDTO;
import com._blog.model.Notification;
import com._blog.model.User;
import com._blog.repository.NotificationRepository;
import com._blog.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;

	public NotificationController(NotificationRepository notificationRepository, UserRepository userRepository) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	@Transactional(readOnly = true)
	public ResponseEntity<List<NotificationDTO>> getNotifications(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		User user = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));

		List<NotificationDTO> dtos = notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
				.map(this::toDto)
				.collect(Collectors.toList());
		return ResponseEntity.ok(dtos);
	}

	@GetMapping("/unread-count")
	public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		User user = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		long count = notificationRepository.countByRecipientAndReadFalse(user);
		return ResponseEntity.ok(Map.of("count", count));
	}

	@PutMapping("/{id}/read")
	@Transactional
	public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		Notification notification = notificationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Notification not found"));
		if (!notification.getRecipient().getUsername().equals(principal.getName())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}
		notification.setRead(true);
		notificationRepository.save(notification);
		return ResponseEntity.ok(toDto(notification));
	}

	@PutMapping("/read-all")
	@Transactional
	public ResponseEntity<?> markAllAsRead(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		User user = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
		for (Notification n : notifications) {
			n.setRead(true);
		}
		notificationRepository.saveAll(notifications);
		return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
	}

	private NotificationDTO toDto(Notification notification) {
		NotificationDTO dto = new NotificationDTO();
		dto.setId(notification.getId());
		dto.setMessage(notification.getMessage());
		dto.setRead(notification.isRead());
		dto.setCreatedAt(notification.getCreatedAt());
		dto.setRelatedPostId(notification.getRelatedPostId());
		return dto;
	}
}
