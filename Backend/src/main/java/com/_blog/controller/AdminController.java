package com._blog.controller;

import com._blog.dto.AdminUserDTO;
import com._blog.dto.ReportDTO;
import com._blog.model.Post;
import com._blog.model.Report;
import com._blog.model.User;
import com._blog.repository.PostRepository;
import com._blog.repository.ReportRepository;
import com._blog.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

	private final UserRepository userRepository;
	private final PostRepository postRepository;
	private final ReportRepository reportRepository;

	public AdminController(UserRepository userRepository, PostRepository postRepository,
			ReportRepository reportRepository) {
		this.userRepository = userRepository;
		this.postRepository = postRepository;
		this.reportRepository = reportRepository;
	}

	@GetMapping("/users")
	@Transactional(readOnly = true)
	public List<AdminUserDTO> getAllUsers() {
		return userRepository.findAll().stream().map(user -> {
			AdminUserDTO dto = new AdminUserDTO();
			dto.setId(user.getId());
			dto.setUsername(user.getUsername());
			dto.setEmail(user.getEmail());
			dto.setBanned(user.isBanned());
			dto.setPostCount(user.getPosts() != null ? user.getPosts().size() : 0);
			dto.setRoles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()));
			return dto;
		}).collect(Collectors.toList());
	}

	@GetMapping("/posts")
	@Transactional(readOnly = true)
	public List<Post> getAllPosts() {
		return postRepository.findAllByOrderByCreatedAtDesc();
	}

	@GetMapping("/reports")
	@Transactional(readOnly = true)
	public List<ReportDTO> getAllReports() {
		return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(report -> {
			ReportDTO dto = new ReportDTO();
			dto.setId(report.getId());
			dto.setReporterUsername(report.getReporter().getUsername());
			dto.setReportedUsername(report.getReportedUser().getUsername());
			dto.setReason(report.getReason());
			dto.setCreatedAt(report.getCreatedAt());
			dto.setStatus(report.getStatus());
			return dto;
		}).collect(Collectors.toList());
	}

	@GetMapping("/stats")
	@Transactional(readOnly = true)
	public Map<String, Object> getStats() {
		long userCount = userRepository.count();
		long postCount = postRepository.count();
		long reportCount = reportRepository.count();
		return Map.of(
				"userCount", userCount,
				"postCount", postCount,
				"reportCount", reportCount);
	}

	@PutMapping("/users/{userId}/ban")
	@Transactional
	public ResponseEntity<?> banUser(@PathVariable Long userId) {
		User user = userRepository.findById(userId).orElseThrow();
		user.setBanned(true);
		userRepository.save(user);
		return ResponseEntity.ok(Map.of("message", "User banned", "username", user.getUsername()));
	}

	@PutMapping("/users/{userId}/unban")
	@Transactional
	public ResponseEntity<?> unbanUser(@PathVariable Long userId) {
		User user = userRepository.findById(userId).orElseThrow();
		user.setBanned(false);
		userRepository.save(user);
		return ResponseEntity.ok(Map.of("message", "User unbanned", "username", user.getUsername()));
	}

	@DeleteMapping("/users/{userId}")
	@Transactional
	public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
		if (!userRepository.existsById(userId)) {
			return ResponseEntity.notFound().build();
		}
		userRepository.deleteById(userId);
		return ResponseEntity.ok(Map.of("message", "User deleted"));
	}

	@DeleteMapping("/posts/{postId}")
	@Transactional
	public ResponseEntity<?> deletePost(@PathVariable Long postId) {
		if (!postRepository.existsById(postId)) {
			return ResponseEntity.notFound().build();
		}
		postRepository.deleteById(postId);
		return ResponseEntity.ok(Map.of("message", "Post deleted"));
	}

	@PutMapping("/posts/{postId}/hide")
	@Transactional
	public ResponseEntity<?> hidePost(@PathVariable Long postId) {
		Post post = postRepository.findById(postId).orElseThrow();
		post.setHidden(true);
		postRepository.save(post);
		return ResponseEntity.ok(Map.of("message", "Post hidden"));
	}

	@PutMapping("/reports/{reportId}/resolve")
	@Transactional
	public ResponseEntity<?> resolveReport(@PathVariable Long reportId) {
		Report report = reportRepository.findById(reportId).orElseThrow();
		report.setStatus("RESOLVED");
		reportRepository.save(report);
		return ResponseEntity.ok(Map.of("message", "Report resolved"));
	}
}
