package com.blog01.controller;

import com.blog01.dto.response.AdminStatsResponse;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.ReportResponse;
import com.blog01.dto.response.UserResponse;
import com.blog01.entity.ReportStatus;
import com.blog01.service.AdminService;
import com.blog01.service.PostService;
import com.blog01.service.ReportService;
import com.blog01.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;
    private final PostService postService;
    private final SecurityUtils securityUtils;

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public PageResponse<UserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.getAllUsers(page, size);
    }

    @PatchMapping("/users/{id}/ban")
    public UserResponse banUser(@PathVariable Long id, @RequestParam boolean banned) {
        return adminService.banUser(id, banned);
    }

    @PatchMapping("/users/{id}/make-admin")
    public UserResponse makeAdmin(@PathVariable Long id) {
        return adminService.makeAdmin(id);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
    }

    @DeleteMapping("/posts/{id}")
    public void deletePost(@PathVariable Long id) {
        postService.deletePost(id, securityUtils.getCurrentUser());
    }

    @GetMapping("/reports")
    public PageResponse<ReportResponse> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ReportStatus status
    ) {
        return reportService.getReports(page, size, status);
    }

    @PatchMapping("/reports/{id}")
    public ReportResponse resolveReport(
            @PathVariable Long id,
            @RequestParam ReportStatus status
    ) {
        return reportService.resolveReport(id, status);
    }
}
