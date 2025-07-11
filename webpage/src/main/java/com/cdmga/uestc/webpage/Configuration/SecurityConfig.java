package com.cdmga.uestc.webpage.Configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 配置CORS规则
        http
            .csrf().disable()
            .cors()  // 开启CORS支持
            .and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/**").permitAll()  // 允许所有路径无需认证
                .anyRequest().authenticated()  // 其他请求需要认证
            );
        return http.build();
    }
}
