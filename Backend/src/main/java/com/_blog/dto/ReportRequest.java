package com._blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReportRequest {
	@NotBlank
	private String reason;
}
