package com._blog.controller;

import com._blog.model.Comment;
import com._blog.model.Post;
import com._blog.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com._blog.model.PostVote;
import com._blog.repository.VoteRepository;
import com._blog.repository.UserRepository;
import com._blog.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:4200")
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

	@PostMapping(consumes = { "multipart/form-data" })
	public ResponseEntity<?> createPost(
			@RequestPart("post") Post post,
			@RequestPart(value = "file", required = false) MultipartFile file,
			Principal principal) {
		if (principal != null) {
			post.setAuthor(principal.getName());
		}
		if (file != null && !file.isEmpty()) {
			try {
				String fileName = saveFile(file);
				post.setMediaUrl("/uploads/" + fileName);
				String contentType = file.getContentType();
				post.setMediaType(contentType != null && contentType.startsWith("video") ? "VIDEO" : "IMAGE");
			} catch (IOException e) {
				return ResponseEntity.internalServerError().body("Could not save file.");
			}
		}
		return ResponseEntity.ok(postRepository.save(post));
	}

	@PostMapping("/{postId}/comments")
	public ResponseEntity<Comment> addComment(
			@PathVariable Long postId,
			@RequestBody Comment comment,
			Principal principal) {
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		if (principal != null) {
			comment.setAuthor(principal.getName());
		} else {
			return ResponseEntity.status(401).build();
		}
		comment.setPost(post);
		post.getComments().add(comment);
		Post savedPost = postRepository.save(post);
		Comment savedComment = savedPost.getComments().get(savedPost.getComments().size() - 1);
		return ResponseEntity.ok(savedComment);
	}

	@DeleteMapping("/{postId}")
	public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
		Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
		if (post.getAuthor().equals(principal.getName())) {
			if (post.getMediaUrl() != null) {
				deleteFile(post.getMediaUrl());
			}
			postRepository.delete(post);
			return ResponseEntity.ok().build();
		}

		return ResponseEntity.status(403).build();
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

	@DeleteMapping("/{postId}/comments/{commentId}")
	public ResponseEntity<?> deleteComment(@PathVariable Long postId, @PathVariable Long commentId,
			Principal principal) {
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));
		Comment commentToDelete = post.getComments().stream()
				.filter(c -> c.getId().equals(commentId))
				.findFirst()
				.orElseThrow(() -> new RuntimeException("Comment not found"));
		if (principal != null && commentToDelete.getAuthor().equals(principal.getName())) {
			post.getComments().remove(commentToDelete);
			postRepository.save(post);
			return ResponseEntity.ok().build();
		}
		return ResponseEntity.status(403).body("You can only delete your own comments");
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

	@PutMapping("/{postId}")
	public ResponseEntity<?> updatePost(
			@PathVariable Long postId,
			@RequestBody Post postDetails,
			Principal principal) {
		Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
		if (principal == null || !post.getAuthor().equals(principal.getName())) {
			return ResponseEntity.status(403).body("You are not authorized to edit this post.");
		}
		post.setContent(postDetails.getContent());
		post.setCategory(postDetails.getCategory());
		return ResponseEntity.ok(postRepository.save(post));
	}

	private Long getUserIdFromPrincipal(Principal principal) {
		if (principal == null) {
			throw new RuntimeException("Not authenticated");
		}
		String emailOrUsername = principal.getName();
		return userRepository.findByUsername(emailOrUsername)
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