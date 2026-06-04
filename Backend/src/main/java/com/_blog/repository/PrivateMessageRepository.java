package com._blog.repository;

import com._blog.model.PrivateMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrivateMessageRepository extends JpaRepository<PrivateMessage, Long> {

	@Query("""
			SELECT m FROM PrivateMessage m
			JOIN FETCH m.sender
			JOIN FETCH m.recipient
			WHERE (m.sender.username = :user AND m.recipient.username = :partner)
			   OR (m.sender.username = :partner AND m.recipient.username = :user)
			ORDER BY m.sentAt ASC
			""")
	List<PrivateMessage> findConversation(@Param("user") String user, @Param("partner") String partner);

	@Query("""
			SELECT m FROM PrivateMessage m
			JOIN FETCH m.sender
			JOIN FETCH m.recipient
			WHERE m.sender.username = :username OR m.recipient.username = :username
			ORDER BY m.sentAt DESC
			""")
	List<PrivateMessage> findAllForUser(@Param("username") String username);

	@Query("""
			SELECT COUNT(m) FROM PrivateMessage m
			WHERE m.recipient.username = :user AND m.sender.username = :partner AND m.read = false
			""")
	long countUnreadFromPartner(@Param("user") String user, @Param("partner") String partner);

	@Query("""
			SELECT COUNT(m) FROM PrivateMessage m
			WHERE m.recipient.username = :user AND m.read = false
			""")
	long countTotalUnread(@Param("user") String user);

	@Modifying
	@Query("""
			UPDATE PrivateMessage m SET m.read = true
			WHERE m.recipient.username = :user AND m.sender.username = :partner AND m.read = false
			""")
	int markConversationAsRead(@Param("user") String user, @Param("partner") String partner);
}
