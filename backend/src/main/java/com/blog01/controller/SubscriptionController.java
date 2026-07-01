package com.blog01.controller;

import com.blog01.dto.response.UserSummary;
import com.blog01.security.SecurityUtils;
import com.blog01.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SecurityUtils securityUtils;

    @GetMapping("/{username}/followers")
    public List<UserSummary> getFollowers(@PathVariable String username) {
        return subscriptionService.getFollowers(username);
    }

    @GetMapping("/{username}/following")
    public List<UserSummary> getFollowing(@PathVariable String username) {
        return subscriptionService.getFollowing(username);
    }

    @PostMapping("/{username}")
    public Map<String, Object> toggleSubscription(@PathVariable String username) {
        return subscriptionService.toggleSubscription(username, securityUtils.getCurrentUser());
    }
}
