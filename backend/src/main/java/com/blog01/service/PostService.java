package com.blog01.service;

import com.blog01.dto.request.PostRequest;
import com.blog01.dto.response.CommentResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.PostResponse;
import com.blog01.entity.*;
import com.blog01.exception.ForbiddenException;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final EntityMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;

    public PageResponse<PostResponse> getFeed(User currentUser, int page, int size) {
        List<Long> followingIds = subscriptionRepository.findFollowingIds(currentUser.getId());
        followingIds.add(currentUser.getId());

        if (followingIds.isEmpty()) {
            return emptyPage(page, size);
        }

        Page<Post> posts = postRepository.findFeedPosts(followingIds, PageRequest.of(page, size));
        return toPageResponse(posts, currentUser, false);
    }

    public PageResponse<PostResponse> getUserPosts(String username, User currentUser, int page, int size) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Page<Post> posts = postRepository.findByAuthorOrderByCreatedAtDesc(author, PageRequest.of(page, size));
        return toPageResponse(posts, currentUser, true);
    }

    public PostResponse getPost(Long id, User currentUser) {
        Post post = findPost(id);
        return toPostResponse(post, currentUser, true);
    }

    @Transactional
    public PostResponse createPost(User currentUser, PostRequest request) {
        Post post = Post.builder()
                .author(currentUser)
                .description(request.getDescription())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType() != null ? request.getMediaType() : MediaType.NONE)
                .build();
        post = postRepository.save(post);

        notificationService.notifyFollowersOfNewPost(currentUser, post);

        PostResponse response = toPostResponse(post, currentUser, true);
        messagingTemplate.convertAndSend("/topic/feed", response);
        return response;
    }

    @Transactional
    public PostResponse updatePost(Long id, User currentUser, PostRequest request) {
        Post post = findPost(id);
        assertOwner(post, currentUser);
        post.setDescription(request.getDescription());
        if (request.getMediaUrl() != null) post.setMediaUrl(request.getMediaUrl());
        if (request.getMediaType() != null) post.setMediaType(request.getMediaType());
        post = postRepository.save(post);
        return toPostResponse(post, currentUser, true);
    }

    @Transactional
    public void deletePost(Long id, User currentUser) {
        Post post = findPost(id);
        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Not allowed to delete this post");
        }
        commentRepository.deleteByPost(post);
        likeRepository.deleteByPost(post);
        reportRepository.deleteByReportedPost(post);
        notificationRepository.deleteByRelatedPostId(post.getId());
        postRepository.delete(post);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    private void assertOwner(Post post, User user) {
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("Not allowed to modify this post");
        }
    }

    private PostResponse toPostResponse(Post post, User currentUser, boolean includeComments) {
        long likes = likeRepository.countByPost(post);
        long comments = commentRepository.countByPost(post);
        boolean liked = likeRepository.existsByPostAndUser(post, currentUser);
        List<CommentResponse> commentList = includeComments
                ? commentRepository.findByPostOrderByCreatedAtAsc(post).stream()
                    .map(mapper::toCommentResponse).toList()
                : List.of();
        return mapper.toPostResponse(post, currentUser, likes, comments, liked, commentList);
    }

    private PageResponse<PostResponse> toPageResponse(Page<Post> page, User currentUser, boolean includeComments) {
        List<PostResponse> content = page.getContent().stream()
                .map(p -> toPostResponse(p, currentUser, includeComments))
                .toList();
        return PageResponse.<PostResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private PageResponse<PostResponse> emptyPage(int page, int size) {
        return PageResponse.<PostResponse>builder()
                .content(Collections.emptyList())
                .page(page)
                .size(size)
                .totalElements(0)
                .totalPages(0)
                .last(true)
                .build();
    }
}
