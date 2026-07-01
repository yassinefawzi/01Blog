package com.blog01.service;

import com.blog01.dto.request.CommentRequest;
import com.blog01.dto.response.CommentResponse;
import com.blog01.entity.Comment;
import com.blog01.entity.Post;
import com.blog01.entity.User;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.CommentRepository;
import com.blog01.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final EntityMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;

    public List<CommentResponse> getComments(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        return commentRepository.findByPostOrderByCreatedAtAsc(post).stream()
                .map(mapper::toCommentResponse)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(Long postId, User currentUser, CommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment comment = Comment.builder()
                .post(post)
                .author(currentUser)
                .content(request.getContent())
                .build();
        comment = commentRepository.save(comment);

        notificationService.notifyPostAuthorOfComment(post, currentUser);

        CommentResponse response = mapper.toCommentResponse(comment);
        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/comments", response);
        return response;
    }

    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(currentUser.getId())
                && currentUser.getRole() != com.blog01.entity.Role.ADMIN) {
            throw new com.blog01.exception.ForbiddenException("Not allowed to delete this comment");
        }
        commentRepository.delete(comment);
    }
}
