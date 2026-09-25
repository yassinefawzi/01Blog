package com.blog01.repository;

import com.blog01.entity.Post;
import com.blog01.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByAuthorAndHiddenFalseOrderByCreatedAtDesc(User author, Pageable pageable);

    Page<Post> findByAuthorIdInAndHiddenFalseOrderByCreatedAtDesc(Collection<Long> authorIds, Pageable pageable);

    Page<Post> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);

    Page<Post> findByAuthorIdInOrderByCreatedAtDesc(Collection<Long> authorIds, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findByAuthor(User author);
}
