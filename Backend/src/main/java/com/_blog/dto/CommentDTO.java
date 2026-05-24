package com._blog.dto;

import lombok.Data;

@Data
public class CommentDTO {
	private Long id;
	private String content;
	private String authorName;
}