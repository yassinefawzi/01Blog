package com._blog.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostSummaryDTO {
    private Long id;
    private String authorName;
    private String title;
    private String content;
    private String category;
    private String mediaUrl;
    private String mediaType;
    private LocalDateTime createdAt;
    private int likes;
    private int dislikes;
    private int commentCount;
    private List<CommentDTO> comments;
}