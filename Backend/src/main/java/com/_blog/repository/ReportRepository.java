package com._blog.repository;

import com._blog.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
	List<Report> findAllByOrderByCreatedAtDesc();
}
