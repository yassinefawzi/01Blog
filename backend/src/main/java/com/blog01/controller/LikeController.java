package com.blog01.controller;

import com.blog01.security.SecurityUtils;
import com.blog01.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public Map<String, Object> toggleLike(@PathVariable Long postId) {
        return likeService.toggleLike(postId, securityUtils.getCurrentUser());
    }
}
