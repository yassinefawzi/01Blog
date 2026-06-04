package com._blog.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminUserDTO {
	private Long id;
	private String username;
	private String email;
	private boolean banned;
	private int postCount;
	private List<String> roles;
}
