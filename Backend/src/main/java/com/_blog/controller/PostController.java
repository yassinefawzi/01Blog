package com._blog.controller;

import com._blog.model.*;
import com._blog.repository.*;
import com._blog.dto.CommentDTO;
import com._blog.service.FileStorageService;
import com._blog.service.NotificationService;
import com._blog.service.WebSocketEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
public class PostController {

	@Autowired
	private PostRepository postRepository;
	@Autowired
	private VoteRepository voteRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private FileStorageService fileStorageService;
	@Autowired
	private NotificationService notificationService;
	@Autowired
	private WebSocketEventPublisher webSocketEventPublisher;

	@GetMapping
	public List<Post> getAllPosts() {
		return postRepository.findAll().stream()
				.filter(p -> !p.isHidden())
				.collect(Collectors.toList());
	}

	@GetMapping("/feed")
	@Transactional(readOnly = true)
	public ResponseEntity<List<Post>> getSocialFeed(Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		User currentUser = userRepository.findByUsernameWithFollowing(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));

		if (currentUser.isBanned()) {
			return ResponseEntity.status(403).build();
		}

		Set<User> feedAuthors = new HashSet<>(currentUser.getFollowing());
		feedAuthors.add(currentUser);

		List<Post> feed = postRepository.findFeedByAuthors(feedAuthors);
		return ResponseEntity.ok(feed);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Transactional
	public ResponseEntity<?> createPost(
			@RequestPart("post") Post postPayload,
			@RequestPart(value = "file", required = false) MultipartFile file,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(401).build();
		}

		User author = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));

		if (author.isBanned()) {
			return ResponseEntity.status(403).body("Banned users cannot create posts.");
		}

		Post post = new Post();
		post.setTitle(postPayload.getTitle());
		post.setContent(postPayload.getContent());
		post.setCategory(postPayload.getCategory() != null ? postPayload.getCategory() : "General");
		post.setAuthor(author);

		if (file != null && !file.isEmpty()) {
			try {
				post.setMediaUrl(fileStorageService.store(file));
				post.setMediaType(fileStorageService.detectMediaType(file));
			} catch (IOException e) {
				return ResponseEntity.internalServerError().body("Failed to store media file.");
			}
		}

		Post saved = postRepository.save(post);
		User authorWithFollowers = userRepository.findByUsernameWithFollowers(author.getUsername())
				.orElse(author);
		saved.setAuthor(authorWithFollowers);
		notificationService.notifyFollowersOfNewPost(saved);
		return ResponseEntity.ok(saved);
	}

	@PostMapping("/{postId}/comments")
	@Transactional
	public ResponseEntity<?> addComment(@PathVariable Long postId, @RequestBody Comment comment, Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		User author = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		if (post.isHidden()) {
			return ResponseEntity.status(404).build();
		}

		Comment newComment = new Comment();
		newComment.setContent(comment.getContent() != null ? comment.getContent() : comment.getText());
		newComment.setAuthor(author);
		newComment.setPost(post);
		post.getComments().add(newComment);

		postRepository.save(post);

		CommentDTO commentDto = new CommentDTO();
		commentDto.setId(newComment.getId());
		commentDto.setContent(newComment.getContent());
		commentDto.setText(newComment.getContent());
		commentDto.setAuthorName(author.getUsername());
		commentDto.setCreatedAt(newComment.getCreatedAt());
		webSocketEventPublisher.sendCommentUpdate(postId, commentDto);

		return ResponseEntity.ok(newComment);
	}

	@DeleteMapping("/{postId}")
	public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		boolean isAuthor = post.getAuthor() != null && post.getAuthor().getUsername().equals(principal.getName());
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isAdmin = auth != null && auth.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (isAuthor || isAdmin) {
			postRepository.delete(post);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.status(403).body("You are not authorized to delete this post.");
	}

	@DeleteMapping("/{postId}/comments/{commentId}")
	@Transactional
	public ResponseEntity<?> deleteComment(@PathVariable Long postId, @PathVariable Long commentId,
			Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId).orElseThrow();
		Comment commentToDelete = post.getComments().stream()
				.filter(c -> c.getId().equals(commentId))
				.findFirst().orElseThrow();

		if (commentToDelete.getAuthor().getUsername().equals(principal.getName()) ||
				post.getAuthor().getUsername().equals(principal.getName())) {
			post.getComments().remove(commentToDelete);
			postRepository.save(post);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.status(403).body("Unauthorized");
	}

	@PutMapping("/{postId}")
	@Transactional
	public ResponseEntity<?> updatePost(@PathVariable Long postId, @RequestBody Map<String, String> payload,
			Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId).orElseThrow();
		if (!post.getAuthor().getUsername().equals(principal.getName())) {
			return ResponseEntity.status(403).build();
		}

		if (payload.containsKey("content")) {
			post.setContent(payload.get("content"));
		}
		if (payload.containsKey("category")) {
			post.setCategory(payload.get("category"));
		}
		if (payload.containsKey("title")) {
			post.setTitle(payload.get("title"));
		}
		postRepository.save(post);
		return ResponseEntity.ok(post);
	}

	@PutMapping("/{postId}/like")
	@Transactional
	public ResponseEntity<?> likePost(@PathVariable Long postId, Principal principal) {
		Long userId = getUserIdFromPrincipal(principal);
		Post post = postRepository.findById(postId).orElseThrow();

		Optional<PostVote> existingVote = voteRepository.findByUserIdAndPostId(userId, postId);
		if (existingVote.isPresent()) {
			PostVote vote = existingVote.get();
			if ("LIKE".equals(vote.getType())) {
				post.setLikes(Math.max(0, post.getLikes() - 1));
				voteRepository.delete(vote);
			} else {
				post.setDislikes(Math.max(0, post.getDislikes() - 1));
				post.setLikes(post.getLikes() + 1);
				vote.setType("LIKE");
				voteRepository.save(vote);
			}
		} else {
			post.setLikes(post.getLikes() + 1);
			voteRepository.save(new PostVote(userId, postId, "LIKE"));
		}
		return ResponseEntity.ok(postRepository.save(post));
	}

	@PutMapping("/{postId}/dislike")
	@Transactional
	public ResponseEntity<?> dislikePost(@PathVariable Long postId, Principal principal) {
		Long userId = getUserIdFromPrincipal(principal);
		Post post = postRepository.findById(postId).orElseThrow();

		Optional<PostVote> existingVote = voteRepository.findByUserIdAndPostId(userId, postId);
		if (existingVote.isPresent()) {
			PostVote vote = existingVote.get();
			if ("DISLIKE".equals(vote.getType())) {
				post.setDislikes(Math.max(0, post.getDislikes() - 1));
				voteRepository.delete(vote);
			} else {
				post.setLikes(Math.max(0, post.getLikes() - 1));
				post.setDislikes(post.getDislikes() + 1);
				vote.setType("DISLIKE");
				voteRepository.save(vote);
			}
		} else {
			post.setDislikes(post.getDislikes() + 1);
			voteRepository.save(new PostVote(userId, postId, "DISLIKE"));
		}
		return ResponseEntity.ok(postRepository.save(post));
	}

	private Long getUserIdFromPrincipal(Principal principal) {
		return userRepository.findByUsername(principal.getName())
				.map(User::getId).orElseThrow(() -> new RuntimeException("User not found"));
	}
}
