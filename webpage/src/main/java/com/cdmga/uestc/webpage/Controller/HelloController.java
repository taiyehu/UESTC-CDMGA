package com.cdmga.uestc.webpage.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String Sayhello(){
        return "hello Spring Boot!";
    }



}
