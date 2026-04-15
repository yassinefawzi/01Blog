package com._blog.config;

import com._blog.model.Role;
import com._blog.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
                Role admin = new Role();
                admin.setName("ROLE_ADMIN");
                roleRepository.save(admin);
            }
            if (roleRepository.findByName("ROLE_USER").isEmpty()) {
                Role user = new Role();
                user.setName("ROLE_USER");
                roleRepository.save(user);
            }
        };
    }
}