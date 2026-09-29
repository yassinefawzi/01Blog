package com.blog01.service;

import com.blog01.dto.request.ReportRequest;
import com.blog01.dto.response.PageResponse;
import com.blog01.dto.response.ReportResponse;
import com.blog01.entity.*;
import com.blog01.exception.BadRequestException;
import com.blog01.exception.ResourceNotFoundException;
import com.blog01.mapper.EntityMapper;
import com.blog01.repository.PostRepository;
import com.blog01.repository.ReportRepository;
import com.blog01.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final EntityMapper mapper;

    @Transactional
    public ReportResponse createReport(User reporter, ReportRequest request) {
        if (request.getReportedUserId() == null && request.getReportedPostId() == null) {
            throw new BadRequestException("Must report a user or a post");
        }

        User reportedUser = null;
        Post reportedPost = null;

        if (request.getReportedUserId() != null) {
            reportedUser = userRepository.findById(request.getReportedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        if (request.getReportedPostId() != null) {
            reportedPost = postRepository.findById(request.getReportedPostId())
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportedPost(reportedPost)
                .reason(request.getReason())
                .build();

        return mapper.toReportResponse(reportRepository.save(report));
    }

    public PageResponse<ReportResponse> getReports(int page, int size, ReportStatus status) {
        Page<Report> reports = status != null
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                : reportRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));

        List<ReportResponse> content = reports.getContent().stream()
                .map(mapper::toReportResponse)
                .toList();

        return PageResponse.<ReportResponse>builder()
                .content(content)
                .page(reports.getNumber())
                .size(reports.getSize())
                .totalElements(reports.getTotalElements())
                .totalPages(reports.getTotalPages())
                .last(reports.isLast())
                .build();
    }

    @Transactional
    public ReportResponse resolveReport(Long id, ReportStatus status) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setStatus(status);
        return mapper.toReportResponse(reportRepository.save(report));
    }
}
