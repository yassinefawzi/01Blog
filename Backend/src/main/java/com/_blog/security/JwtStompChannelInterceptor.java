package com._blog.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {

	private final JwtUtil jwtUtil;

	public JwtStompChannelInterceptor(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null || accessor.getCommand() == null) {
			return message;
		}

		if (StompCommand.CONNECT.equals(accessor.getCommand())) {
			String token = resolveToken(accessor);
			if (token == null || !jwtUtil.isTokenValid(token)) {
				throw new IllegalArgumentException("Invalid or missing JWT for WebSocket connection");
			}

			String username = jwtUtil.extractUsername(token);
			List<String> roles = jwtUtil.extractRoles(token);
			List<SimpleGrantedAuthority> authorities = roles.stream()
					.map(SimpleGrantedAuthority::new)
					.collect(Collectors.toList());

			UsernamePasswordAuthenticationToken authentication =
					new UsernamePasswordAuthenticationToken(username, null, authorities);
			accessor.setUser(authentication);
		}

		return message;
	}

	private String resolveToken(StompHeaderAccessor accessor) {
		String authHeader = accessor.getFirstNativeHeader("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}
		String tokenHeader = accessor.getFirstNativeHeader("token");
		if (tokenHeader != null && !tokenHeader.isBlank()) {
			return tokenHeader;
		}
		return null;
	}
}
