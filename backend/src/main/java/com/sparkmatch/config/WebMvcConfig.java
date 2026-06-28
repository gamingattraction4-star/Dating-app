package com.sparkmatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves user-uploaded photos saved by {@code MediaService} to the local
 * uploads directory.
 *
 * MediaService stores files at {@code <uploadDir>/photos/{userId}/{file}} and
 * builds public URLs as {@code <cdn-base>/photos/{userId}/{file}}. When the CDN
 * base points back at this server (the default for non-S3 deploys), this handler
 * makes those URLs resolve.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        // Spring wants a trailing slash and a file: URI it can read from.
        String location = base.toUri().toString();

        registry.addResourceHandler("/photos/**")
                .addResourceLocations(location + "photos/");
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
