package com._blog.repository;

import com._blog.model.Notification;
import com._blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

	long countByRecipientAndReadFalse(User recipient);
}
