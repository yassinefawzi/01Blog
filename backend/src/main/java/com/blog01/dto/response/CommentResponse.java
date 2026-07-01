package com.blog01.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private Instant createdAt;
    private UserSummary author;
}
