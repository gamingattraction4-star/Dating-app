package com.sparkmatch.account.service;

import com.sparkmatch.account.dto.ChangeEmailRequest;
import com.sparkmatch.account.dto.ChangePasswordRequest;
import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.DuplicateResourceException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Soft-delete the user account.
     * Sets status to DEACTIVATED, marks deleted_at timestamp, and anonymizes PII.
     */
    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(User.UserStatus.DEACTIVATED);
        user.setDeletedAt(LocalDateTime.now());
        // Anonymize PII
        user.setEmail("deleted_" + userId + "@sparkmatch.com");
        user.setPhone(null);
        userRepository.save(user);

        log.info("Account deleted (soft) for userId={}", userId);
    }

    /**
     * Temporarily deactivate the profile — user is hidden from discovery.
     */
    @Transactional
    public void deactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() == User.UserStatus.DEACTIVATED) {
            throw new BadRequestException("Account is already deactivated");
        }

        user.setStatus(User.UserStatus.DEACTIVATED);
        userRepository.save(user);

        log.info("Account deactivated for userId={}", userId);
    }

    /**
     * Re-activate a previously deactivated account.
     */
    @Transactional
    public void reactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != User.UserStatus.DEACTIVATED) {
            throw new BadRequestException("Account is not deactivated");
        }

        if (user.getDeletedAt() != null) {
            throw new BadRequestException("Account has been permanently deleted and cannot be reactivated");
        }

        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);

        log.info("Account reactivated for userId={}", userId);
    }

    /**
     * Change password — requires current password for verification.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from the current one");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed for userId={}", userId);
    }

    /**
     * Change email — requires password for verification.
     */
    @Transactional
    public void changeEmail(Long userId, ChangeEmailRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Password is incorrect");
        }

        if (userRepository.existsByEmail(request.getNewEmail())) {
            throw new DuplicateResourceException("Email already in use by another account");
        }

        user.setEmail(request.getNewEmail());
        userRepository.save(user);

        log.info("Email changed for userId={}", userId);
    }
}
