package com._blog.controller;

import com._blog.model.Comment;
import com._blog.model.Post;
import com._blog.model.PostVote;
import com._blog.model.User;
import com._blog.repository.PostRepository;
import com._blog.repository.UserRepository;
import com._blog.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/posts")
public class PostController {

	@Autowired
	private PostRepository postRepository;
	@Autowired
	private VoteRepository voteRepository;
	@Autowired
	private UserRepository userRepository;

	@GetMapping
	public List<Post> getAllPosts() {
		return postRepository.findAll();
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> createPost(
			@RequestPart("post") Post post,
			@RequestPart(value = "file", required = false) MultipartFile file,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(401).body("Unauthorized");
		}

		User user = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));
		post.setAuthor(user);

		if (file != null && !file.isEmpty()) {
			try {
				String fileName = saveFile(file);
				post.setMediaUrl("/uploads/" + fileName);
				String contentType = file.getContentType();
				if (contentType != null && contentType.startsWith("video")) {
					post.setMediaType("VIDEO");
				} else {
					post.setMediaType("IMAGE");
				}
			} catch (IOException e) {
				return ResponseEntity.internalServerError().body("Could not save file.");
			}
		}
		return ResponseEntity.ok(postRepository.save(post));
	}

	@PostMapping("/{postId}/comments")
	public ResponseEntity<?> addComment(
			@PathVariable Long postId,
			@RequestBody Comment comment,
			Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(401).build();
		}

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));
		comment.setAuthor(principal.getName());
		comment.setPost(post);

		post.getComments().add(comment);
		Post savedPost = postRepository.save(post);

		Comment savedComment = savedPost.getComments().get(savedPost.getComments().size() - 1);
		return ResponseEntity.ok(savedComment);
	}

	@DeleteMapping("/{postId}")
	public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		if (post.getAuthor() != null && post.getAuthor().getUsername().equals(principal.getName())) {
			if (post.getMediaUrl() != null) {
				deleteFile(post.getMediaUrl());
			}
			postRepository.delete(post);
			return ResponseEntity.ok().build();
		}

		return ResponseEntity.status(403).body("You are not authorized to delete this post.");
	}

	@DeleteMapping("/{postId}/comments/{commentId}")
	public ResponseEntity<?> deleteComment(
			@PathVariable Long postId,
			@PathVariable Long commentId,
			Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		Comment commentToDelete = post.getComments().stream()
				.filter(c -> c.getId().equals(commentId))
				.findFirst()
				.orElseThrow(() -> new RuntimeException("Comment not found"));

		boolean isCommentAuthor = commentToDelete.getAuthor() != null &&
				commentToDelete.getAuthor().equals(principal.getName());

		boolean isPostOwner = post.getAuthor() != null &&
				post.getAuthor().getUsername().equals(principal.getName());

		if (isCommentAuthor || isPostOwner) {
			post.getComments().remove(commentToDelete);
			postRepository.save(post);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.status(403).body("You can only delete comments you wrote or own.");
	}

	@PutMapping("/{postId}")
	@org.springframework.transaction.annotation.Transactional
	public ResponseEntity<?> updatePost(
			@PathVariable Long postId,
			@RequestBody java.util.Map<String, String> payload,
			Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		if (post.getAuthor() == null || !post.getAuthor().getUsername().equals(principal.getName())) {
			return ResponseEntity.status(403).body("Unauthorized edit request.");
		}

		String newContent = payload.get("content");
		if (newContent != null) {
			post.setContent(newContent);
		}
		java.util.Map<String, Object> response = new java.util.HashMap<>();
		response.put("id", post.getId());
		response.put("content", post.getContent());
		response.put("status", "SUCCESS");

		return ResponseEntity.ok(response);
	}

	@PutMapping("/{postId}/like")
	public ResponseEntity<?> likePost(@PathVariable Long postId, Principal principal) {
		Long userId = getUserIdFromPrincipal(principal);
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		Optional<PostVote> existingVote = voteRepository.findByUserIdAndPostId(userId, postId);

		if (existingVote.isPresent()) {
			PostVote vote = existingVote.get();

			if (vote.getType().equals("LIKE")) {
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
	public ResponseEntity<?> dislikePost(@PathVariable Long postId, Principal principal) {
		Long userId = getUserIdFromPrincipal(principal);
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		Optional<PostVote> existingVote = voteRepository.findByUserIdAndPostId(userId, postId);

		if (existingVote.isPresent()) {
			PostVote vote = existingVote.get();

			if (vote.getType().equals("DISLIKE")) {
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

	@GetMapping("/feed")
	public ResponseEntity<List<Post>> getSocialFeed(Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		User currentUser = userRepository.findByUsername(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));

		Set<User> feedAuthors = new HashSet<>(currentUser.getFollowing());
		feedAuthors.add(currentUser);
		List<Post> feed = postRepository.findByAuthorInOrderByCreatedAtDesc(feedAuthors);

		return ResponseEntity.ok(feed);
	}

	private void deleteFile(String mediaUrl) {
		try {
			String relativePath = mediaUrl.startsWith("/") ? mediaUrl.substring(1) : mediaUrl;
			Path filePath = Paths.get(relativePath);
			Files.deleteIfExists(filePath);
			System.out.println("Successfully deleted file: " + filePath);
		} catch (IOException e) {
			System.err.println("Failed to delete file: " + e.getMessage());
		}
	}

	private Long getUserIdFromPrincipal(Principal principal) {
		if (principal == null) {
			throw new RuntimeException("Not authenticated");
		}
		return userRepository.findByUsername(principal.getName())
				.map(User::getId)
				.orElseThrow(() -> new RuntimeException("User not found"));
	}

	private String saveFile(MultipartFile file) throws IOException {
		String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
		Path uploadPath = Paths.get("uploads");
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}
		try (InputStream inputStream = file.getInputStream()) {
			Path filePath = uploadPath.resolve(fileName);
			Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
		}
		return fileName;
	}
}