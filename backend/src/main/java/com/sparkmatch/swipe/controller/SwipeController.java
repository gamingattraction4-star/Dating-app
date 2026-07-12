package com.sparkmatch.swipe.controller;

import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.swipe.dto.*;
import com.sparkmatch.swipe.service.SwipeService;
import com.sparkmatch.user.dto.ProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SwipeController {

    private final SwipeService swipeService;

    @GetMapping("/discover")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> discover(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = (Long) auth.getPrincipal();
        List<ProfileResponse> profiles = swipeService.getDiscoverProfiles(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    /** People / Explore — browse by interest and/or "looking for" category. */
    @GetMapping("/explore")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> explore(
            Authentication auth,
            @RequestParam(required = false) String interest,
            @RequestParam(required = false) String lookingFor,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Long userId = (Long) auth.getPrincipal();
        List<ProfileResponse> profiles = swipeService.getExploreProfiles(userId, interest, lookingFor, page, size);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @PostMapping("/swipes")
    public ResponseEntity<ApiResponse<SwipeResponse>> swipe(
            Authentication auth,
            @Valid @RequestBody SwipeRequest request) {
        Long userId = (Long) auth.getPrincipal();
        SwipeResponse response = swipeService.swipe(userId, request);
        String message = response.isMatched() ? "It's a match! 🎉" : "Swipe recorded";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @PostMapping("/swipes/undo")
    public ResponseEntity<ApiResponse<Void>> undoSwipe(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        swipeService.undoSwipe(userId);
        return ResponseEntity.ok(ApiResponse.success("Swipe undone"));
    }

    @GetMapping("/matches")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMatches(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<MatchResponse> matches = swipeService.getMatches(userId);
        return ResponseEntity.ok(ApiResponse.success(matches));
    }

    @DeleteMapping("/matches/{matchId}")
    public ResponseEntity<ApiResponse<Void>> unmatch(
            Authentication auth,
            @PathVariable Long matchId) {
        Long userId = (Long) auth.getPrincipal();
        swipeService.unmatch(userId, matchId);
        return ResponseEntity.ok(ApiResponse.success("Unmatched successfully"));
    }

    @GetMapping("/premium/likes")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> whoLikedMe(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<ProfileResponse> profiles = swipeService.getWhoLikedMe(userId);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }
}
