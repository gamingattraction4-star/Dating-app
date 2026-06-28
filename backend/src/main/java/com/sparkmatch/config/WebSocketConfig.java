package com.sparkmatch.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory broker for subscribing
        // In production, replace with RabbitMQ/Redis broker
        config.enableSimpleBroker("/queue", "/topic");
        // Prefix for messages FROM clients
        config.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws/chat")
            .addInterceptors(webSocketAuthInterceptor)
            .setAllowedOriginPatterns("*")
            .withSockJS();

        // Also register without SockJS for native mobile clients
        registry
            .addEndpoint("/ws/chat")
            .addInterceptors(webSocketAuthInterceptor)
            .setAllowedOriginPatterns("*");
    }
}
