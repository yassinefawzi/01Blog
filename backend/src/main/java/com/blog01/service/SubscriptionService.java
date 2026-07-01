package com.blog01.service;

import com.blog01.dto.response.UserSummary;
import com.blog01.entity.NotificationType;
import com.blog01.entity.Subscription;
import com.blog01.entity.User;
import com.blog01.exception.BadRequestException;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.SubscriptionRepository;
import com.blog01.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EntityMapper mapper;

    public List<UserSummary> getFollowers(String username) {
        User user = findUser(username);
        return subscriptionRepository.findFollowers(user.getId()).stream()
                .map(mapper::toUserSummary)
                .toList();
    }

    public List<UserSummary> getFollowing(String username) {
        User user = findUser(username);
        return subscriptionRepository.findFollowing(user.getId()).stream()
                .map(mapper::toUserSummary)
                .toList();
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public Map<String, Object> toggleSubscription(String username, User currentUser) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (target.getId().equals(currentUser.getId())) {
            throw new BadRequestException("Cannot subscribe to yourself");
        }

        var existing = subscriptionRepository.findByFollowerAndFollowing(currentUser, target);
        boolean subscribed;
        if (existing.isPresent()) {
            subscriptionRepository.delete(existing.get());
            subscribed = false;
        } else {
            subscriptionRepository.save(Subscription.builder()
                    .follower(currentUser)
                    .following(target)
                    .build());
            subscribed = true;
            notificationService.createNotification(
                    target,
                    currentUser.getUsername() + " started following you",
                    NotificationType.NEW_FOLLOWER,
                    null,
                    currentUser.getId()
            );
        }

        return Map.of(
                "subscribed", subscribed,
                "followersCount", subscriptionRepository.countByFollowing(target),
                "followingCount", subscriptionRepository.countByFollower(currentUser)
        );
    }
}
