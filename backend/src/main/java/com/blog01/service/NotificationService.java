package com.blog01.service;

import com.blog01.dto.response.NotificationResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.entity.*;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.NotificationRepository;
import com.blog01.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EntityMapper mapper;

    public PageResponse<NotificationResponse> getNotifications(User user, int page, int size) {
        Page<Notification> notifications = notificationRepository
                .findByRecipientOrderByCreatedAtDesc(user, PageRequest.of(page, size));
        List<NotificationResponse> content = notifications.getContent().stream()
                .map(mapper::toNotificationResponse)
                .toList();
        return PageResponse.<NotificationResponse>builder()
                .content(content)
                .page(notifications.getNumber())
                .size(notifications.getSize())
                .totalElements(notifications.getTotalElements())
                .totalPages(notifications.getTotalPages())
                .last(notifications.isLast())
                .build();
    }

    public Map<String, Long> getUnreadCount(User user) {
        return Map.of("count", notificationRepository.countByRecipientAndReadFalse(user));
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new com.blog01.exception.ForbiddenException("Not your notification");
        }
        notification.setRead(true);
        return mapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalse(user.getId());
        unread.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void notifyFollowersOfNewPost(User author, Post post) {
        subscriptionRepository.findFollowerByFollowingIdOrderByCreatedAtDesc(author.getId()).forEach(follower ->
                createNotification(
                        follower,
                        author.getUsername() + " published a new post",
                        NotificationType.NEW_POST,
                        post.getId(),
                        author.getId()
                ));
    }

    public void notifyPostAuthorOfComment(Post post, User commenter) {
        if (!post.getAuthor().getId().equals(commenter.getId())) {
            createNotification(
                    post.getAuthor(),
                    commenter.getUsername() + " commented on your post",
                    NotificationType.NEW_COMMENT,
                    post.getId(),
                    commenter.getId()
            );
        }
    }

    public void notifyPostAuthorOfLike(Post post, User liker) {
        if (!post.getAuthor().getId().equals(liker.getId())) {
            createNotification(
                    post.getAuthor(),
                    liker.getUsername() + " liked your post",
                    NotificationType.NEW_LIKE,
                    post.getId(),
                    liker.getId()
            );
        }
    }

    public void createNotification(User recipient, String message, NotificationType type,
                                   Long postId, Long userId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .relatedPostId(postId)
                .relatedUserId(userId)
                .build();
        notificationRepository.save(notification);
    }
}
