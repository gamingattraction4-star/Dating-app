package com.sparkmatch.media.controller;

import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.media.service.MediaService;
import com.sparkmatch.user.dto.ProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/photos")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProfileResponse.PhotoDto>> uploadPhoto(
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "orderIndex", defaultValue = "0") int orderIndex) {

        if (file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB
            throw new BadRequestException("File size must not exceed 10MB");
        }

        Long userId = (Long) auth.getPrincipal();
        ProfileResponse.PhotoDto photo = mediaService.uploadPhoto(userId, file, orderIndex);
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", photo));
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            Authentication auth,
            @PathVariable Long photoId) {
        Long userId = (Long) auth.getPrincipal();
        mediaService.deletePhoto(userId, photoId);
        return ResponseEntity.ok(ApiResponse.success("Photo deleted"));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<List<ProfileResponse.PhotoDto>>> reorderPhotos(
            Authentication auth,
            @RequestBody List<Long> photoIds) {
        Long userId = (Long) auth.getPrincipal();
        List<ProfileResponse.PhotoDto> photos = mediaService.reorderPhotos(userId, photoIds);
        return ResponseEntity.ok(ApiResponse.success("Photos reordered", photos));
    }
}
