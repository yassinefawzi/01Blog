package com._blog.controller;

import com._blog.dto.ReportRequest;
import com._blog.model.Report;
import com._blog.model.User;
import com._blog.repository.ReportRepository;
import com._blog.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

	private final ReportRepository reportRepository;
	private final UserRepository userRepository;

	public ReportController(ReportRepository reportRepository, UserRepository userRepository) {
		this.reportRepository = reportRepository;
		this.userRepository = userRepository;
	}

	@PostMapping("/user/{username}")
	public ResponseEntity<?> reportUser(
			@PathVariable String username,
			@Valid @RequestBody ReportRequest request,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		if (principal.getName().equals(username)) {
			return ResponseEntity.badRequest().body(Map.of("message", "You cannot report yourself."));
		}

		User reporter = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("Reporter not found"));
		User reported = userRepository.findByUsername(username)
				.orElseThrow(() -> new RuntimeException("Reported user not found"));

		Report report = new Report();
		report.setReporter(reporter);
		report.setReportedUser(reported);
		report.setReason(request.getReason());
		reportRepository.save(report);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(Map.of("message", "Report submitted successfully."));
	}
}
