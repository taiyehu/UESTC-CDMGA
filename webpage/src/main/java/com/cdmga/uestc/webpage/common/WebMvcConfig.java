package com.cdmga.uestc.webpage.common;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private final String avatarUploadDirectory;

    public WebMvcConfig(@Value("${avatar.upload.directory}") String avatarUploadDirectory) {
        this.avatarUploadDirectory = avatarUploadDirectory;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:/var/webserver/images/");
        registry.addResourceHandler("/scores/**")
                .addResourceLocations("file:/var/webserver/scores/");
        String avatarResourceLocation = Path.of(avatarUploadDirectory)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        if (!avatarResourceLocation.endsWith("/")) {
            avatarResourceLocation += "/";
        }
        registry.addResourceHandler("/avatars/**")
                .addResourceLocations(avatarResourceLocation);
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:/var/webserver/files/");
        registry.addResourceHandler("/banners/**")
                .addResourceLocations("file:/var/webserver/banners/");
    }
}
