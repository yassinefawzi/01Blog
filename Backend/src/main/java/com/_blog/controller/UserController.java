package com._blog.controller;

import com._blog.dto.RegisterRequest;
import com._blog.dto.UserProfileDTO;
import com._blog.model.User;
import com._blog.repository.PostRepository;
import com._blog.repository.UserRepository;
import com._blog.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class UserController {
	private final UserService userService;
	private final UserRepository userRepository;
	private final PostRepository postRepository;

	public UserController(UserService userService, UserRepository userRepository, PostRepository postRepository) {
		this.userService = userService;
		this.userRepository = userRepository;
		this.postRepository = postRepository;
	}

	@PostMapping("/register")
	public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody RegisterRequest request) {
		User user = new User();
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setPassword(request.getPassword());
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setPhoneNumber(request.getPhoneNumber());
		user.setCity(request.getCity());
		userService.registerUser(user);
		return new ResponseEntity<>(Map.of("message", "registration successful."), HttpStatus.CREATED);
	}

	@GetMapping("/profile/{username}")
	public ResponseEntity<?> getUserProfile(@PathVariable String username) {
		return userRepository.findByUsername(username)
				.map(user -> {
					Map<String, Object> response = new HashMap<>();
					response.put("id", user.getId());
					response.put("username", user.getUsername());
					response.put("email", user.getEmail());
					response.put("posts", user.getPosts());
					response.put("followersCount", user.getFollowers() != null ? user.getFollowers().size() : 0);
					response.put("followingCount", user.getFollowing() != null ? user.getFollowing().size() : 0);
					List<String> roles = user.getRoles().stream()
							.map(role -> role.getName())
							.collect(Collectors.toList());
					response.put("roles", roles);

					return ResponseEntity.ok(response);
				})
				.orElse(ResponseEntity.notFound().build());
	}

	@PostMapping("/follow/{username}")
	public ResponseEntity<?> toggleFollow(@PathVariable String username, @RequestParam String currentUsername) {
		User currentUser = userRepository.findByUsername(currentUsername)
				.orElseThrow(() -> new RuntimeException("Current user not found"));
		User targetUser = userRepository.findByUsername(username)
				.orElseThrow(() -> new RuntimeException("Target user not found"));

		if (currentUser.getFollowing().contains(targetUser)) {
			currentUser.getFollowing().remove(targetUser);
			userRepository.save(currentUser);
			return ResponseEntity.ok(Map.of("status", "unfollowed"));
		} else {
			currentUser.getFollowing().add(targetUser);
			userRepository.save(currentUser);
			return ResponseEntity.ok(Map.of("status", "followed"));
		}
	}
}