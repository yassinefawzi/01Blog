package com._blog.repository;

import com._blog.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    long countByAuthorUsername(String username);

    List<Post> findByAuthorUsernameOrderByCreatedAtDesc(String username);
}