package com.blog01.service;

import com.blog01.dto.request.UpdateProfileRequest;
import com.blog01.dto.response.UserResponse;
import com.blog01.entity.User;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.UserRepository;
import com.blog01.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EntityMapper mapper;
    private final StorageService storageService;

    public List<UserResponse> searchUsers(String query, User currentUser, int limit) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        int cappedLimit = Math.min(Math.max(limit, 1), 20);
        return userRepository
                .findByBannedFalseAndUsernameContainingIgnoreCaseOrderByUsernameAsc(
                        query.trim(), PageRequest.of(0, cappedLimit))
                .stream()
                .map(user -> mapper.toUserResponse(user, currentUser))
                .toList();
    }

    public UserResponse getProfile(String username, User currentUser) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapper.toUserResponse(user, currentUser);
    }

    @Transactional
    public UserResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        if (request.getBio() != null) {
            currentUser.setBio(request.getBio());
        }
        User saved = userRepository.save(currentUser);
        return mapper.toUserResponse(saved, saved);
    }

    @Transactional
    public UserResponse uploadAvatar(User currentUser, MultipartFile file) {
        if (currentUser.getAvatarUrl() != null) {
            storageService.delete(currentUser.getAvatarUrl());
        }
        String url = storageService.store(file);
        currentUser.setAvatarUrl(url);
        User saved = userRepository.save(currentUser);
        return mapper.toUserResponse(saved, saved);
    }
}
