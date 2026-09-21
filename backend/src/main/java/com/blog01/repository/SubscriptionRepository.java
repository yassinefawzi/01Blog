package com.blog01.repository;

import com.blog01.entity.Subscription;
import com.blog01.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByFollowerAndFollowing(User follower, User following);
    boolean existsByFollowerAndFollowing(User follower, User following);

    List<Long> findFollowingIdByFollowerId(Long followerId);

    List<User> findFollowerByFollowingIdOrderByCreatedAtDesc(Long followingId);

    List<User> findFollowingByFollowerIdOrderByCreatedAtDesc(Long followerId);

    long countByFollowing(User following);
    long countByFollower(User follower);
}
