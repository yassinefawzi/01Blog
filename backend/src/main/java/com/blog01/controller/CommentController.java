package com.blog01.controller;

import com.blog01.dto.request.CommentRequest;
import com.blog01.dto.response.CommentResponse;
import com.blog01.security.SecurityUtils;
import com.blog01.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return commentService.getComments(postId);
    }

    @PostMapping
    public CommentResponse addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.addComment(postId, securityUtils.getCurrentUser(), request);
    }

    @DeleteMapping("/{commentId}")
    public void deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId, securityUtils.getCurrentUser());
    }
}
