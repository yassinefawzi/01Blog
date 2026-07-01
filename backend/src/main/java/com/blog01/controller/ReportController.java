package com.blog01.controller;

import com.blog01.dto.request.ReportRequest;
import com.blog01.dto.response.ReportResponse;
import com.blog01.security.SecurityUtils;
import com.blog01.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ReportResponse createReport(@Valid @RequestBody ReportRequest request) {
        return reportService.createReport(securityUtils.getCurrentUser(), request);
    }
}
