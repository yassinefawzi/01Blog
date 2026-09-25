package com.blog01.repository;

import com.blog01.entity.Subscription;
import com.blog01.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByFollowerAndFollowing(User follower, User following);
    boolean existsByFollowerAndFollowing(User follower, User following);

    @Query("SELECT s.following.id FROM Subscription s WHERE s.follower.id = :followerId")
    List<Long> findFollowingIdByFollowerId(@Param("followerId") Long followerId);

    @Query("SELECT s.follower FROM Subscription s WHERE s.following.id = :followingId ORDER BY s.createdAt DESC")
    List<User> findFollowerByFollowingIdOrderByCreatedAtDesc(@Param("followingId") Long followingId);

    @Query("SELECT s.following FROM Subscription s WHERE s.follower.id = :followerId ORDER BY s.createdAt DESC")
    List<User> findFollowingByFollowerIdOrderByCreatedAtDesc(@Param("followerId") Long followerId);

    long countByFollowing(User following);
    long countByFollower(User follower);

    void deleteByFollower(User follower);
    void deleteByFollowing(User following);
}
