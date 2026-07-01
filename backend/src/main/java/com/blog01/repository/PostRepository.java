package com.blog01.repository;

import com.blog01.entity.Post;
import com.blog01.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.author.id IN :authorIds ORDER BY p.createdAt DESC")
    Page<Post> findFeedPosts(@Param("authorIds") Collection<Long> authorIds, Pageable pageable);
}
