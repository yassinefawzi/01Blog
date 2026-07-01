package com.blog01.controller;

import com.blog01.dto.request.PostRequest;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.PostResponse;
import com.blog01.security.SecurityUtils;
import com.blog01.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final SecurityUtils securityUtils;

    @GetMapping("/feed")
    public PageResponse<PostResponse> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return postService.getFeed(securityUtils.getCurrentUser(), page, size);
    }

    @GetMapping("/user/{username}")
    public PageResponse<PostResponse> getUserPosts(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return postService.getUserPosts(username, securityUtils.getCurrentUser(), page, size);
    }

    @GetMapping("/{id}")
    public PostResponse getPost(@PathVariable Long id) {
        return postService.getPost(id, securityUtils.getCurrentUser());
    }

    @PostMapping
    public PostResponse createPost(@Valid @RequestBody PostRequest request) {
        return postService.createPost(securityUtils.getCurrentUser(), request);
    }

    @PutMapping("/{id}")
    public PostResponse updatePost(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        return postService.updatePost(id, securityUtils.getCurrentUser(), request);
    }

    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable Long id) {
        postService.deletePost(id, securityUtils.getCurrentUser());
    }
}
