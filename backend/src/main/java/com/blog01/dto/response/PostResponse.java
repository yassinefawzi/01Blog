package com.blog01.dto.response;

import com.blog01.entity.MediaType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class PostResponse {
    private Long id;
    private String description;
    private String mediaUrl;
    private MediaType mediaType;
    private Instant createdAt;
    private Instant updatedAt;
    private UserSummary author;
    private long likesCount;
    private long commentsCount;
    private boolean likedByCurrentUser;
    private List<CommentResponse> comments;
}
