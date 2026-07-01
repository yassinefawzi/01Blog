package com.blog01.mapper;

import com.blog01.dto.response.*;
import com.blog01.entity.*;
import com.blog01.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EntityMapper {

    private final SubscriptionRepository subscriptionRepository;

    public UserSummary toUserSummary(User user) {
        if (user == null) return null;
        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public UserResponse toUserResponse(User user, User currentUser) {
        boolean subscribed = currentUser != null
                && !currentUser.getId().equals(user.getId())
                && subscriptionRepository.existsByFollowerAndFollowing(currentUser, user);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(currentUser != null && currentUser.getId().equals(user.getId()) ? user.getEmail() : null)
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .followersCount(subscriptionRepository.countByFollowing(user))
                .followingCount(subscriptionRepository.countByFollower(user))
                .subscribed(subscribed)
                .ownProfile(currentUser != null && currentUser.getId().equals(user.getId()))
                .banned(user.isBanned())
                .build();
    }

    public CommentResponse toCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .author(toUserSummary(comment.getAuthor()))
                .build();
    }

    public PostResponse toPostResponse(Post post, User currentUser, long likesCount, long commentsCount,
                                       boolean liked, List<CommentResponse> comments) {
        return PostResponse.builder()
                .id(post.getId())
                .description(post.getDescription())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .author(toUserSummary(post.getAuthor()))
                .likesCount(likesCount)
                .commentsCount(commentsCount)
                .likedByCurrentUser(liked)
                .comments(comments)
                .build();
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .relatedPostId(notification.getRelatedPostId())
                .relatedUserId(notification.getRelatedUserId())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public ReportResponse toReportResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reporter(toUserSummary(report.getReporter()))
                .reportedUser(toUserSummary(report.getReportedUser()))
                .reportedPostId(report.getReportedPost() != null ? report.getReportedPost().getId() : null)
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
