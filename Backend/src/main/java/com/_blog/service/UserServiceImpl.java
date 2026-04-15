package com._blog.service;

import com._blog.model.Role;
import com._blog.model.User;
import com._blog.repository.RoleRepository;
import com._blog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Override
	public User registerUser(User user) {
		user.setPassword(passwordEncoder.encode(user.getPassword()));

		Set<Role> roles = new HashSet<>();
		if (userRepository.count() == 0) {
			Role adminRole = roleRepository.findByName("ROLE_ADMIN")
					.orElseThrow(() -> new RuntimeException("Admin role not found"));
			roles.add(adminRole);
		} else {
			Role userRole = roleRepository.findByName("ROLE_USER")
					.orElseThrow(() -> new RuntimeException("User role not found"));
			roles.add(userRole);
		}
		user.setRoles(roles);
		return userRepository.save(user);
	}
}