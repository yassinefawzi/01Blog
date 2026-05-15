package com._blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

	private final JwtUtil jwtUtil;

	public JwtAuthFilter(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain)
			throws ServletException, IOException {

		String path = request.getServletPath();
		if (path != null && path.startsWith("/uploads/")) {
			filterChain.doFilter(request, response);
			return;
		}

		String token = jwtUtil.getJwtFromCookies(request);
		String authHeader = request.getHeader("Authorization");

		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
		} else {
			token = jwtUtil.getJwtFromCookies(request);
		}

		if (token != null && jwtUtil.isTokenValid(token)) {
			try {
				String username = jwtUtil.extractUsername(token);
				List<String> roles = jwtUtil.extractRoles(token);

				List<SimpleGrantedAuthority> authorities = roles.stream()
						.map(SimpleGrantedAuthority::new)
						.collect(Collectors.toList());

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						username, null, authorities);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(authentication);

				// ADD THIS LINE:
				System.out.println("SUCCESSFULLY AUTHENTICATED IN FILTER: " + username + " WITH ROLES: " + authorities);

			} catch (Exception e) {
				logger.error("Could not set user authentication: {}", e.getMessage());
			}
		}
		filterChain.doFilter(request, response);
	}
}