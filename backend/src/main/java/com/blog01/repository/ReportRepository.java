package com.blog01.repository;

import com.blog01.entity.Post;
import com.blog01.entity.Report;
import com.blog01.entity.ReportStatus;
import com.blog01.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
    void deleteByReportedPost(Post post);
    void deleteByReporter(User reporter);
    void deleteByReportedUser(User reportedUser);

    @Query("select count(distinct r.reportedUser.id) from Report r where r.reportedUser is not null")
    long countDistinctReportedUsers();
}
