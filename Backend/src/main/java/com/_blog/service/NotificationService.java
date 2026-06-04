package com._blog.service;

import com._blog.dto.NotificationDTO;
import com._blog.model.Notification;
import com._blog.model.Post;
import com._blog.model.User;
import com._blog.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final WebSocketEventPublisher eventPublisher;

	public NotificationService(
			NotificationRepository notificationRepository,
			WebSocketEventPublisher eventPublisher) {
		this.notificationRepository = notificationRepository;
		this.eventPublisher = eventPublisher;
	}

	@Transactional
	public void notifyFollowersOfNewPost(Post post) {
		User author = post.getAuthor();
		if (author == null || author.getFollowers() == null) {
			return;
		}
		String message = "@" + author.getUsername() + " published a new post: " + post.getTitle();
		for (User follower : author.getFollowers()) {
			Notification notification = new Notification();
			notification.setRecipient(follower);
			notification.setMessage(message);
			notification.setRelatedPostId(post.getId());
			Notification saved = notificationRepository.save(notification);
			eventPublisher.sendNotification(follower.getUsername(), toDto(saved));
		}
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
