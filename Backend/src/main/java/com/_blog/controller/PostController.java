package com._blog.controller;

import com._blog.model.*;
import com._blog.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.security.Principal;
import java.util.*;

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

	@GetMapping("/feed")
	@Transactional(readOnly = true)
	public ResponseEntity<List<Post>> getSocialFeed(Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		User currentUser = userRepository.findByUsernameWithFollowing(principal.getName())
				.orElseThrow(() -> new RuntimeException("User not found"));

		Set<User> feedAuthors = new HashSet<>(currentUser.getFollowing());
		feedAuthors.add(currentUser);
		if (feedAuthors.isEmpty())
			return ResponseEntity.ok(Collections.emptyList());

		List<Post> feed = postRepository.findFeedByAuthors(feedAuthors);
		return ResponseEntity.ok(feed);
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

		comment.setAuthor(author);
		comment.setPost(post);
		post.getComments().add(comment);

		postRepository.save(post);
		return ResponseEntity.ok(comment);
	}

	@DeleteMapping("/{postId}")
	public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
		if (principal == null)
			return ResponseEntity.status(401).build();

		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		if (post.getAuthor() != null && post.getAuthor().getUsername().equals(principal.getName())) {
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

		post.setContent(payload.get("content"));
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