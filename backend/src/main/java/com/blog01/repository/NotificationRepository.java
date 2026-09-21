package com.blog01.repository;

import com.blog01.entity.Notification;
import com.blog01.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);
    long countByRecipientAndReadFalse(User recipient);

    List<Notification> findByRecipientIdAndReadFalse(Long recipientId);

    void deleteByRelatedPostId(Long relatedPostId);
}
