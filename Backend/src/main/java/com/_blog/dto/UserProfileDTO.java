package com._blog.dto;

import com._blog.model.Post;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class UserProfileDTO {
    private String username;
    private String firstName;
    private String lastName;
    private long postCount;
    private int followersCount;
    private int followingCount;
    private List<Post> posts;
}