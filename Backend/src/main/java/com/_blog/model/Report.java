package com._blog.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "reports")
public class Report {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "reporter_id", nullable = false)
	private User reporter;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "reported_user_id", nullable = false)
	private User reportedUser;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String reason;

	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(nullable = false)
	private String status = "PENDING";
}
