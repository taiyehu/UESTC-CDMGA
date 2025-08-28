package com.cdmga.uestc.webpage.Configuration; // 使用您自己的包名

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.CorsFilter; // 引入 CorsFilter

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * 跨域过滤器
     */
    @Autowired(required = false) // 使用 required = false 避免在生产环境因Bean不存在而报错
    private CorsFilter corsFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 关闭 CSRF
        http.csrf(csrf -> csrf.disable());

        // ======================= 修改部分开始 =======================
        // 只有在 corsFilter Bean 存在时 (即开发环境) 才添加它
        if (corsFilter != null) {
            // 将CORS过滤器添加到UsernamePasswordAuthenticationFilter之前
            // 确保在进行身份认证前，跨域问题已经被处理
            http.addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class);
        }
        // ======================= 修改部分结束 =======================

        // 配置请求授权规则
        http.authorizeHttpRequests(authz -> authz
            .requestMatchers("/**").permitAll() // 允许所有路径无需认证
            .anyRequest().authenticated()
        );

        return http.build();
    }
}