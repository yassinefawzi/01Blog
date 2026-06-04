package com._blog.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReportDTO {
	private Long id;
	private String reporterUsername;
	private String reportedUsername;
	private String reason;
	private LocalDateTime createdAt;
	private String status;
}
