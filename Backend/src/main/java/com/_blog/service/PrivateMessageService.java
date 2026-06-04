package com._blog.service;

import com._blog.dto.ConversationDTO;
import com._blog.dto.PrivateMessageDTO;
import com._blog.model.PrivateMessage;
import com._blog.model.User;
import com._blog.repository.PrivateMessageRepository;
import com._blog.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PrivateMessageService {

	private final PrivateMessageRepository messageRepository;
	private final UserRepository userRepository;
	private final WebSocketEventPublisher eventPublisher;

	public PrivateMessageService(
			PrivateMessageRepository messageRepository,
			UserRepository userRepository,
			WebSocketEventPublisher eventPublisher) {
		this.messageRepository = messageRepository;
		this.userRepository = userRepository;
		this.eventPublisher = eventPublisher;
	}

	@Transactional
	public PrivateMessageDTO sendMessage(String senderUsername, String recipientUsername, String content) {
		if (senderUsername.equals(recipientUsername)) {
			throw new IllegalArgumentException("Cannot message yourself.");
		}
		String trimmed = content != null ? content.trim() : "";
		if (trimmed.isEmpty()) {
			throw new IllegalArgumentException("Message cannot be empty.");
		}

		User sender = userRepository.findByUsername(senderUsername)
				.orElseThrow(() -> new RuntimeException("Sender not found"));
		User recipient = userRepository.findByUsername(recipientUsername)
				.orElseThrow(() -> new RuntimeException("Recipient not found"));

		if (sender.isBanned() || recipient.isBanned()) {
			throw new IllegalStateException("Messaging is not allowed for banned accounts.");
		}

		PrivateMessage message = new PrivateMessage();
		message.setSender(sender);
		message.setRecipient(recipient);
		message.setContent(trimmed);
		PrivateMessage saved = messageRepository.save(message);

		PrivateMessageDTO dto = toDto(saved);
		eventPublisher.sendPrivateMessage(recipientUsername, dto);
		eventPublisher.sendPrivateMessage(senderUsername, dto);
		return dto;
	}

	@Transactional(readOnly = true)
	public List<PrivateMessageDTO> getConversation(String currentUsername, String partnerUsername) {
		return messageRepository.findConversation(currentUsername, partnerUsername).stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ConversationDTO> getConversations(String username) {
		List<PrivateMessage> messages = messageRepository.findAllForUser(username);
		Map<String, ConversationDTO> conversations = new LinkedHashMap<>();

		for (PrivateMessage message : messages) {
			String partner = message.getSender().getUsername().equals(username)
					? message.getRecipient().getUsername()
					: message.getSender().getUsername();

			if (!conversations.containsKey(partner)) {
				ConversationDTO dto = new ConversationDTO();
				dto.setPartnerUsername(partner);
				dto.setLastMessage(message.getContent());
				dto.setLastMessageAt(message.getSentAt());
				dto.setUnreadCount(messageRepository.countUnreadFromPartner(username, partner));
				conversations.put(partner, dto);
			}
		}

		return new ArrayList<>(conversations.values());
	}

	@Transactional
	public void markConversationAsRead(String currentUsername, String partnerUsername) {
		messageRepository.markConversationAsRead(currentUsername, partnerUsername);
	}

	@Transactional(readOnly = true)
	public long getTotalUnreadCount(String username) {
		return messageRepository.countTotalUnread(username);
	}

	private PrivateMessageDTO toDto(PrivateMessage message) {
		PrivateMessageDTO dto = new PrivateMessageDTO();
		dto.setId(message.getId());
		dto.setSenderUsername(message.getSender().getUsername());
		dto.setRecipientUsername(message.getRecipient().getUsername());
		dto.setContent(message.getContent());
		dto.setSentAt(message.getSentAt());
		dto.setRead(message.isRead());
		return dto;
	}
}
