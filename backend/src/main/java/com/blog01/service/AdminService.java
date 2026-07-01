package com.blog01.service;

import com.blog01.dto.response.AdminStatsResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.UserResponse;
import com.blog01.entity.ReportStatus;
import com.blog01.entity.Role;
import com.blog01.entity.User;
import com.blog01.exception.BadRequestException;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.PostRepository;
import com.blog01.repository.ReportRepository;
import com.blog01.repository.UserRepository;
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
    private final ReportRepository reportRepository;
    private final EntityMapper mapper;

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.count())
                .pendingReports(reportRepository.findByStatusOrderByCreatedAtDesc(
                        ReportStatus.PENDING, PageRequest.of(0, 1)).getTotalElements())
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
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }
}
