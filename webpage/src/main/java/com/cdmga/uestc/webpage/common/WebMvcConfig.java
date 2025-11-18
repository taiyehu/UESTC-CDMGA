package com.cdmga.uestc.webpage.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:/var/webserver/images/");
        registry.addResourceHandler("/scores/**")
                .addResourceLocations("file:/var/webserver/scores/");
        registry.addResourceHandler("/avatars/**")
                .addResourceLocations("file:/var/webserver/avatars/");
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:/var/webserver/files/");
        registry.addResourceHandler("/banners/**")
                .addResourceLocations("file:/var/webserver/banners/");
    }
}
