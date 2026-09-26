package com.blog01.service;

import com.blog01.dto.request.LoginRequest;
import com.blog01.dto.request.RegisterRequest;
import com.blog01.dto.response.AuthResponse;
import com.blog01.dto.response.UserResponse;
import com.blog01.entity.Role;
import com.blog01.entity.User;
import com.blog01.exception.BadRequestException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.UserRepository;
import com.blog01.security.JwtService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    @Lazy
    private final AuthenticationManager authenticationManager;
    private final EntityMapper mapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        UserResponse userResponse = mapper.toUserResponse(user, user);

        return AuthResponse.builder().token(token).user(userResponse).build();
    }

    public AuthResponse login(LoginRequest request) {
		authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));
        String token = jwtService.generateToken(user);
        UserResponse userResponse = mapper.toUserResponse(user, user);
        return AuthResponse.builder().token(token).user(userResponse).build();
    }
}
