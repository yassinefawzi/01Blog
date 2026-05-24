package com._blog.controller;

import com._blog.dto.CommentDTO;
import com._blog.dto.PostSummaryDTO;
import com._blog.dto.RegisterRequest;
import com._blog.dto.UserProfileDTO;
import com._blog.model.User;
import com._blog.repository.PostRepository;
import com._blog.repository.UserRepository;
import com._blog.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
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
	@Transactional
	public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable String username, Principal principal) {
		return userRepository.findByUsername(username)
				.map(user -> {
					UserProfileDTO profileDTO = new UserProfileDTO();
					profileDTO.setId(user.getId());
					profileDTO.setUsername(user.getUsername());
					profileDTO.setEmail(user.getEmail());
					int followersCount = user.getFollowers() != null ? user.getFollowers().size() : 0;
					int followingCount = user.getFollowing() != null ? user.getFollowing().size() : 0;
					int postCount = user.getPosts() != null ? user.getPosts().size() : 0;

					profileDTO.setFollowersCount(followersCount);
					profileDTO.setFollowingCount(followingCount);
					profileDTO.setPostCount(postCount);

					List<PostSummaryDTO> postDTOs = user.getPosts().stream().map(post -> {
						PostSummaryDTO pDto = new PostSummaryDTO();
						pDto.setId(post.getId());
						pDto.setAuthorName(post.getAuthor().getUsername());
						pDto.setContent(post.getContent());
						pDto.setLikes(post.getLikes());
						pDto.setDislikes(post.getDislikes());
						pDto.setCommentCount(post.getComments() != null ? post.getComments().size() : 0);

						List<CommentDTO> commentDTOs = post.getComments().stream().map(c -> {
							CommentDTO cDto = new CommentDTO();
							cDto.setId(c.getId());
							cDto.setContent(c.getContent());
							cDto.setAuthorName(c.getAuthor() != null ? c.getAuthor().getUsername() : "Unknown");
							return cDto;
						}).collect(Collectors.toList());

						pDto.setComments(commentDTOs);
						return pDto;
					}).collect(Collectors.toList());

					profileDTO.setPosts(postDTOs);

					boolean isFollowing = false;
					if (principal != null) {
						isFollowing = userRepository.findByUsername(principal.getName())
								.map(curr -> curr.getFollowing() != null && curr.getFollowing().contains(user))
								.orElse(false);
					}
					profileDTO.setFollowing(isFollowing);
					return ResponseEntity.ok(profileDTO);
				})
				.orElse(ResponseEntity.notFound().build());
	}

	@PostMapping("/follow/{username}")
	@Transactional
	public ResponseEntity<?> toggleFollow(@PathVariable String username, Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required"));
		}

		String currentUsername = principal.getName();
		if (currentUsername.equals(username)) {
			return ResponseEntity.badRequest().body(Map.of("message", "You cannot follow yourself."));
		}

		User currentUser = userRepository.findByUsername(currentUsername)
				.orElseThrow(() -> new RuntimeException("Logged-in user context missing"));
		User targetUser = userRepository.findByUsername(username)
				.orElseThrow(() -> new RuntimeException("Target user profile not found"));

		boolean alreadyFollowing = currentUser.getFollowing().contains(targetUser);

		if (alreadyFollowing) {
			currentUser.getFollowing().remove(targetUser);
			userRepository.save(currentUser);
			return ResponseEntity.ok(Map.of("status", "unfollowed", "isFollowing", false));
		} else {
			currentUser.getFollowing().add(targetUser);
			userRepository.save(currentUser);
			return ResponseEntity.ok(Map.of("status", "followed", "isFollowing", true));
		}
	}
}