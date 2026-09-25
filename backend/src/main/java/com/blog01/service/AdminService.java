package com.blog01.service;

import com.blog01.dto.response.AdminStatsResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.PostResponse;
import com.blog01.dto.response.UserResponse;
import com.blog01.entity.Post;
import com.blog01.entity.ReportStatus;
import com.blog01.entity.Role;
import com.blog01.entity.User;
import com.blog01.exception.BadRequestException;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final PostService postService;
    private final EntityMapper mapper;

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.count())
                .pendingReports(reportRepository.findByStatusOrderByCreatedAtDesc(
                        ReportStatus.PENDING, PageRequest.of(0, 1)).getTotalElements())
                .reportedUsers(reportRepository.countDistinctReportedUsers())
                .bannedUsers(userRepository.findAll().stream().filter(User::isBanned).count())
                .build();
    }

    public PageResponse<UserResponse> getAllUsers(int page, int size) {
        Page<User> users = userRepository.findAll(PageRequest.of(page, size));
        List<UserResponse> content = users.getContent().stream()
                .map(u -> mapper.toUserResponse(u, null))
                .toList();
        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
    }

    public PageResponse<PostResponse> getAllPosts(User admin, int page, int size) {
        return postService.getAllPosts(admin, page, size);
    }

    @Transactional
    public UserResponse banUser(Long id, boolean banned) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setBanned(banned);
        return mapper.toUserResponse(userRepository.save(user), null);
    }

    @Transactional
    public UserResponse makeAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("User is already an admin");
        }
        user.setRole(Role.ADMIN);
        return mapper.toUserResponse(userRepository.save(user), null);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Remove posts owned by the user (and their dependent rows)
        List<Post> posts = postRepository.findByAuthor(user);
        for (Post post : posts) {
            postService.deletePost(post.getId(), user);
        }

        // Remove interactions authored by the user on others' content
        commentRepository.deleteByAuthor(user);
        likeRepository.deleteByUser(user);

        // Remove follow graph edges
        subscriptionRepository.deleteByFollower(user);
        subscriptionRepository.deleteByFollowing(user);

        // Remove notifications about / for this user
        notificationRepository.deleteByRecipient(user);
        notificationRepository.deleteByRelatedUserId(user.getId());

        // Remove reports filed by or against this user
        reportRepository.deleteByReporter(user);
        reportRepository.deleteByReportedUser(user);

        userRepository.delete(user);
    }
}
