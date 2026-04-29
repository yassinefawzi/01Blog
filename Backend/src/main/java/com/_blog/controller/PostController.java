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

	@PostMapping
	public Post createPost(@RequestBody Post post) {
		return postRepository.save(post);
	}

	@PostMapping("/{postId}/comments")
	public Comment addComment(@PathVariable Long postId, @RequestBody Comment comment) {
		Post post = postRepository.findById(postId)
				.orElseThrow(() -> new RuntimeException("Post not found"));

		post.getComments().add(comment);

		postRepository.save(post);
		return comment;
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

	private Long getUserIdFromPrincipal(Principal principal) {
		if (principal == null) {
			throw new RuntimeException("Not authenticated");
		}
		String emailOrUsername = principal.getName();
		return userRepository.findByUsername(emailOrUsername)
				.map(User::getId)
				.orElseThrow(() -> new RuntimeException("User not found"));
	}
}