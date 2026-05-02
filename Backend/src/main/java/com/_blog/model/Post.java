package com._blog.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Data
@NoArgsConstructor
public class Post {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String author;
	private String title;

	@Column(columnDefinition = "TEXT")
	private String content;

	private LocalDateTime createdAt = LocalDateTime.now();
	private int likes = 0;
	private int dislikes = 0;
	@OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Comment> comments = new ArrayList<>();
	private String category;
	private String mediaUrl;
	private String mediaType;

	@JsonProperty("commentCount")
	public int getCommentCount() {
		return this.comments != null ? this.comments.size() : 0;
	}
}