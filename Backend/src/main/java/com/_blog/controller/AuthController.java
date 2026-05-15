package com._blog.controller;

import com._blog.dto.LoginRequest;
import com._blog.dto.LoginResponse;
import com._blog.model.User;
import com._blog.repository.UserRepository;
import com._blog.security.JwtUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;

	public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest request) {
		User user = userRepository.findByUsername(request.getUsername()).orElse(null);

		if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "Invalid username or password"));
		}

		List<String> roles = user.getRoles().stream()
				.map(role -> role.getName())
				.collect(Collectors.toList());
		String token = jwtUtil.generateToken(user.getUsername(), roles);
		return ResponseEntity.ok(new LoginResponse(user.getUsername(), roles, token));
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout() {
		ResponseCookie cookie = jwtUtil.getCleanJwtCookie();
		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, cookie.toString())
				.body(Map.of("message", "You have been logged out"));
	}

	@GetMapping("/me")
	public ResponseEntity<?> getCurrentUser(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		User user = userRepository.findByUsername(authentication.getName()).orElse(null);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		List<String> roles = user.getRoles().stream()
				.map(role -> role.getName())
				.collect(Collectors.toList());
		String token = jwtUtil.generateToken(user.getUsername(), roles);
		return ResponseEntity.ok(new LoginResponse(user.getUsername(), roles, token));
	}
}