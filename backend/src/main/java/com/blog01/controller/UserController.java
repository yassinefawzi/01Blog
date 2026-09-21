package com.blog01.controller;

import com.blog01.dto.response.UserResponse;
import com.blog01.security.SecurityUtils;
import com.blog01.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/search")
    public List<UserResponse> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return userService.searchUsers(q, securityUtils.getCurrentUser(), limit);
    }

    @GetMapping("/{username}")
    public UserResponse getProfile(@PathVariable String username) {
        return userService.getProfile(username, securityUtils.getCurrentUser());
    }

    @PostMapping("/me/avatar")
    public UserResponse uploadAvatar(@RequestParam("file") MultipartFile file) {
        return userService.uploadAvatar(securityUtils.getCurrentUser(), file);
    }
}
