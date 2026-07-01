package com.blog01.dto.response;

import com.blog01.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private NotificationType type;
    private boolean read;
    private Long relatedPostId;
    private Long relatedUserId;
    private Instant createdAt;
}
