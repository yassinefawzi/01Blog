package com.blog01.service;

import com.blog01.entity.Like;
import com.blog01.entity.Post;
import com.blog01.entity.User;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.repository.LikeRepository;
import com.blog01.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> toggleLike(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        var existing = likeRepository.findByPostAndUser(post, currentUser);
        boolean liked;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            liked = false;
        } else {
            likeRepository.save(Like.builder().post(post).user(currentUser).build());
            liked = true;
            notificationService.notifyPostAuthorOfLike(post, currentUser);
        }

        long count = likeRepository.countByPost(post);
        return Map.of("liked", liked, "likesCount", count);
    }
}
