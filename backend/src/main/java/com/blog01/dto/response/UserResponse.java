package com.blog01.dto.response;

import com.blog01.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private Role role;
    private Instant createdAt;
    private long followersCount;
    private long followingCount;
    private boolean subscribed;
    private boolean ownProfile;
    private boolean banned;
}
