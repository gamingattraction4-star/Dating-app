package com.sparkmatch.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends push notifications to devices via Expo's Push API.
 *
 * Expo relays to FCM (Android) / APNs (iOS) for us, so no Firebase SDK is needed
 * server-side — we just POST the recipient's Expo push token. Delivery is
 * best-effort and never blocks the calling flow.
 *
 * Endpoint: https://exp.host/--/api/v2/push/send
 */
@Slf4j
@Service
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private final RestClient rest = RestClient.create();

    /**
     * @param expoToken recipient device token, e.g. "ExponentPushToken[xxxx]"
     */
    public void send(String expoToken, String title, String body, Map<String, Object> data) {
        if (expoToken == null || expoToken.isBlank() || !expoToken.startsWith("ExponentPushToken")) {
            return; // No valid device token registered.
        }
        try {
            Map<String, Object> payload = Map.of(
                    "to", expoToken,
                    "title", title,
                    "body", body,
                    "sound", "default",
                    "priority", "high",
                    "data", data == null ? Map.of() : data
            );
            rest.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(payload))
                    .retrieve()
                    .toBodilessEntity();
            log.debug("Expo push sent to {}", expoToken);
        } catch (Exception e) {
            // Never let a push failure break the match/message flow.
            log.warn("Expo push failed: {}", e.getMessage());
        }
    }
}
