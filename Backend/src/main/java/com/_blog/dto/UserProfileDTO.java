package com._blog.dto;

import lombok.Data;
import java.util.List;
import com._blog.model.Post;

@Data
public class UserProfileDTO {
    private Long id;
    private String username;
    private String email;
    private int postCount;
    private int followersCount;
    private int followingCount;
    private List<Post> posts; 
}