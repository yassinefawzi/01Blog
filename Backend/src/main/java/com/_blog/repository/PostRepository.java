package com._blog.repository;

import com._blog.model.Post;
import com._blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Set;

public interface PostRepository extends JpaRepository<Post, Long> {
	@Query("SELECT DISTINCT p FROM Post p " +
			"LEFT JOIN FETCH p.author " +
			"LEFT JOIN FETCH p.comments " +
			"WHERE p.author IN :authors " +
			"ORDER BY p.createdAt DESC")
	List<Post> findFeedByAuthors(@Param("authors") Set<User> authors);

	long countByAuthorUsername(String username);

	@Query("SELECT DISTINCT p FROM Post p " +
			"LEFT JOIN FETCH p.author " +
			"LEFT JOIN FETCH p.comments " +
			"WHERE p.author.username = :username " +
			"ORDER BY p.createdAt DESC")
	List<Post> findProfilePostsByUsername(@Param("username") String username);
}