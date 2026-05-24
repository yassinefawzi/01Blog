package com._blog.dto;

import lombok.Data;
import java.util.List;

@Data
public class PostSummaryDTO {
    private Long id;
    private String authorName;
    private String content;
    private int likes;
    private int dislikes;
    private int commentCount;
    private List<CommentDTO> comments;
}