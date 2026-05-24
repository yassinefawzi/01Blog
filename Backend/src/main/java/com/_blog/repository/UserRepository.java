package com._blog.repository;

import com._blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
	@Query("SELECT u FROM User u LEFT JOIN FETCH u.following WHERE u.username = :username")
    Optional<User> findByUsernameWithFollowing(@Param("username") String username);
}
