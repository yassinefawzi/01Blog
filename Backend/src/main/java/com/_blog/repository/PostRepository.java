package com._blog.repository;

import com._blog.model.Post;
import com._blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Set;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByAuthorInOrderByCreatedAtDesc(Set<User> authors);
    
    long countByAuthorUsername(String username);
    List<Post> findByAuthorUsernameOrderByCreatedAtDesc(String username);
}