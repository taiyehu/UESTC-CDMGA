package com.cdmga.uestc.webpage.common;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private final String courseUploadDirectory;
    private final String scoreUploadDirectory;
    private final String avatarUploadDirectory;
    private final String activityFileDirectory;
    private final String activityBannerDirectory;

    public WebMvcConfig(
            @Value("${course.upload.directory}") String courseUploadDirectory,
            @Value("${score.upload.directory}") String scoreUploadDirectory,
            @Value("${avatar.upload.directory}") String avatarUploadDirectory,
            @Value("${activity.upload.file-directory}") String activityFileDirectory,
            @Value("${activity.upload.banner-directory}") String activityBannerDirectory) {
        this.courseUploadDirectory = courseUploadDirectory;
        this.scoreUploadDirectory = scoreUploadDirectory;
        this.avatarUploadDirectory = avatarUploadDirectory;
        this.activityFileDirectory = activityFileDirectory;
        this.activityBannerDirectory = activityBannerDirectory;
    }

    private String location(String directory) {
        String uri = Path.of(directory).toAbsolutePath().normalize().toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations(location(courseUploadDirectory));
        registry.addResourceHandler("/scores/**")
                .addResourceLocations(location(scoreUploadDirectory));
        registry.addResourceHandler("/avatars/**")
                .addResourceLocations(location(avatarUploadDirectory));
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location(activityFileDirectory));
        registry.addResourceHandler("/banners/**")
                .addResourceLocations(location(activityBannerDirectory));
    }
}
