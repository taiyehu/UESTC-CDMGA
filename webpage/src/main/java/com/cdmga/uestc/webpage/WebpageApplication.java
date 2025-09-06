package com.cdmga.uestc.webpage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableAutoConfiguration
@SpringBootApplication
public class WebpageApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebpageApplication.class, args);
		// At the end of your main method or after successful startup
		System.out.println("应用启动成功!");
	}
	
}
