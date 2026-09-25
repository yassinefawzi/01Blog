package com.blog01.repository;

import com.blog01.entity.Comment;
import com.blog01.entity.Post;
import com.blog01.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostOrderByCreatedAtAsc(Post post);
    long countByPost(Post post);
    void deleteByPost(Post post);
    void deleteByAuthor(User author);
}
