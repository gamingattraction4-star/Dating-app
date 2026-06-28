package com.sparkmatch.media.service;

import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.user.dto.ProfileResponse;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.model.UserPhoto;
import com.sparkmatch.user.repository.UserPhotoRepository;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final UserPhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${app.cdn.base-url}")
    private String cdnBaseUrl;

    private static final int MAX_PHOTOS = 6;

    @Transactional
    public ProfileResponse.PhotoDto uploadPhoto(Long userId, MultipartFile file, int orderIndex) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        int currentCount = photoRepository.countByUserId(userId);
        if (currentCount >= MAX_PHOTOS) {
            throw new BadRequestException("Maximum " + MAX_PHOTOS + " photos allowed");
        }

        // Generate unique filename
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString() + extension;
        String key = "photos/" + userId + "/" + filename;

        // For local dev: save to filesystem
        // In production: upload to S3
        String photoUrl;
        try {
            Path uploadDir = Paths.get("uploads", "photos", userId.toString());
            Files.createDirectories(uploadDir);
            Path filePath = uploadDir.resolve(filename);
            Files.write(filePath, file.getBytes());
            photoUrl = cdnBaseUrl + "/" + key;
            log.info("Photo saved locally: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to save photo", e);
            throw new BadRequestException("Failed to upload photo");
        }

        boolean isPrimary = currentCount == 0; // First photo is primary

        UserPhoto photo = UserPhoto.builder()
                .user(user)
                .photoUrl(photoUrl)
                .thumbnailUrl(photoUrl) // In production, generate thumbnail
                .orderIndex(orderIndex)
                .isPrimary(isPrimary)
                .build();
        photo = photoRepository.save(photo);

        return ProfileResponse.PhotoDto.builder()
                .id(photo.getId())
                .photoUrl(photo.getPhotoUrl())
                .thumbnailUrl(photo.getThumbnailUrl())
                .orderIndex(photo.getOrderIndex())
                .primary(photo.getIsPrimary())
                .build();
    }

    @Transactional
    public void deletePhoto(Long userId, Long photoId) {
        UserPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", photoId));

        if (!photo.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only delete your own photos");
        }

        photoRepository.delete(photo);

        // If deleted photo was primary, make next one primary
        if (photo.getIsPrimary()) {
            List<UserPhoto> remaining = photoRepository.findByUserIdOrderByOrderIndexAsc(userId);
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsPrimary(true);
                photoRepository.save(remaining.get(0));
            }
        }
    }

    @Transactional
    public List<ProfileResponse.PhotoDto> reorderPhotos(Long userId, List<Long> photoIds) {
        List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(userId);

        for (int i = 0; i < photoIds.size(); i++) {
            Long photoId = photoIds.get(i);
            for (UserPhoto photo : photos) {
                if (photo.getId().equals(photoId)) {
                    photo.setOrderIndex(i);
                    photo.setIsPrimary(i == 0);
                    break;
                }
            }
        }
        photoRepository.saveAll(photos);

        return photos.stream().map(p -> ProfileResponse.PhotoDto.builder()
                .id(p.getId())
                .photoUrl(p.getPhotoUrl())
                .thumbnailUrl(p.getThumbnailUrl())
                .orderIndex(p.getOrderIndex())
                .primary(p.getIsPrimary())
                .build()).collect(Collectors.toList());
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
