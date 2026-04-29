package com._blog.repository;

import com._blog.model.PostVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<PostVote, Long> {
    Optional<PostVote> findByUserIdAndPostId(Long userId, Long postId);
}