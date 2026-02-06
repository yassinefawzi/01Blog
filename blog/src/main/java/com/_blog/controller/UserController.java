package com._blog.controller;

import com._blog.dto.RegisterRequest;
import com._blog.model.User;
import com._blog.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;


@RestController
@RequestMapping("/api/users")
public class UserController {
	private final UserService userService;

	public UserController(UserService userService) {
        this.userService = userService;
    }

	@PostMapping("/register")
	public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest request) {
		User user = new User();
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setPassword(request.getPassword());
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setPhoneNumber(request.getPhoneNumber());
		user.setCity(request.getCity());

		userService.registerUser(user);
		return new ResponseEntity<>("registration successful.", HttpStatus.CREATED);
	}	
}
