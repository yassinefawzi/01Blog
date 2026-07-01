package com.blog01.repository;

import com.blog01.entity.Like;
import com.blog01.entity.Post;
import com.blog01.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByPostAndUser(Post post, User user);
    long countByPost(Post post);
    boolean existsByPostAndUser(Post post, User user);
    void deleteByPost(Post post);
}
