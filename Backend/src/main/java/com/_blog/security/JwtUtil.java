package com._blog.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

	@Value("${jwt.secret}")
	private String secret;

	@Value("${jwt.expiration}")
	private long expiration;

	private final String cookieName = "blog_auth_token";

	private SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor(secret.getBytes());
	}

	public String getJwtFromCookies(HttpServletRequest request) {
		Cookie cookie = WebUtils.getCookie(request, cookieName);
		if (cookie != null) {
			return cookie.getValue();
		}
		return null;
	}

	public ResponseCookie generateJwtCookie(String username, List<String> roles) {
		String jwt = generateToken(username, roles);
		return ResponseCookie.from(cookieName, jwt)
				.path("/")
				.maxAge(expiration / 1000)
				.httpOnly(true)
				.secure(false)
				.build();
	}

	public String generateToken(String username, List<String> roles) {
		return Jwts.builder()
				.subject(username)
				.claim("roles", roles)
				.issuedAt(new Date())
				.expiration(new Date(System.currentTimeMillis() + expiration))
				.signWith(getSigningKey())
				.compact();
	}

	public ResponseCookie getCleanJwtCookie() {
		return ResponseCookie.from(cookieName, "")
				.path("/")
				.maxAge(0)
				.build();
	}

	public String extractUsername(String token) {
		return getClaims(token).getSubject();
	}

	public List<String> extractRoles(String token) {
		return getClaims(token).get("roles", List.class);
	}

	public boolean isTokenValid(String token) {
		try {
			getClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	private Claims getClaims(String token) {
		return Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}