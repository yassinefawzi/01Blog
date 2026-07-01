package com.blog01.controller;

import com.blog01.dto.response.NotificationResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.security.SecurityUtils;
import com.blog01.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<NotificationResponse> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return notificationService.getNotifications(securityUtils.getCurrentUser(), page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return notificationService.getUnreadCount(securityUtils.getCurrentUser());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id, securityUtils.getCurrentUser());
    }

    @PatchMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead(securityUtils.getCurrentUser());
    }
}
