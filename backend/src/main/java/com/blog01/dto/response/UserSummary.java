package com.blog01.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummary {
    private Long id;
    private String username;
    private String avatarUrl;
}
