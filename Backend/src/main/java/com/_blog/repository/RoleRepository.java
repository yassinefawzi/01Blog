package com._blog.repository;

import com._blog.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;


public interface RoleRepository extends JpaRepository<Role, Long> {
	Optional<Role> findByName(String name);
}