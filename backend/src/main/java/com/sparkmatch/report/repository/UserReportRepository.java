package com.sparkmatch.report.repository;

import com.sparkmatch.report.model.UserReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    boolean existsByReporterIdAndReportedId(Long reporterId, Long reportedId);

    List<UserReport> findByReporterId(Long reporterId);

    @Query("SELECT r FROM UserReport r WHERE r.reported.id = :reportedId")
    List<UserReport> findByReportedId(@Param("reportedId") Long reportedId);

    Page<UserReport> findByStatus(UserReport.ReportStatus status, Pageable pageable);

    @Query("SELECT COUNT(r) FROM UserReport r WHERE r.reported.id = :userId AND r.status != 'DISMISSED'")
    long countActiveReportsAgainst(@Param("userId") Long userId);
}
