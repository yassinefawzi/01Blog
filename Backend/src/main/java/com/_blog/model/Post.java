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
	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "post_id")
	private List<Comment> comments = new ArrayList<>();

	public int getLikes() {
		return likes;
	}

	public void setLikes(int likes) {
		this.likes = likes;
	}

	public int getDislikes() {
		return dislikes;
	}

	public void setDislikes(int dislikes) {
		this.dislikes = dislikes;
	}

	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "post_id")

	@JsonProperty("commentCount")
	public int getCommentCount() {
		return this.comments != null ? this.comments.size() : 0;
	}
}