package com.cdmga.uestc.webpage;

import static org.junit.jupiter.api.Assertions.*;

import com.cdmga.uestc.webpage.Entity.Identity;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.cdmga.uestc.webpage.Controller.HelloController;
import com.cdmga.uestc.webpage.Repository.IdentityRepository;
import com.cdmga.uestc.webpage.Service.IdentityService;

@SpringBootTest
class WebpageApplicationTests {

	@Test
	void contextLoads() {
	}
	@Autowired
	private HelloController helloController;

	@Autowired
	private IdentityRepository identityRepository;

	@Test
	public void helloControllerTest(){
		String hello = helloController.Sayhello();
		System.out.println(hello);
	}

	@Test
	public void getIdentityByAccountTest(){
		// 创建一个模拟的 IdentityRepository
        IdentityRepository mockRepository = Mockito.mock(IdentityRepository.class);

        // 创建一个假数据模拟返回的用户信息
        String account = "testUser";
        Identity mockUser = new Identity();
        mockUser.setAccount(account);
        mockUser.setPassword("admin");

        // 模拟 repository 调用返回预设的 mockUser
        Mockito.when(mockRepository.findByAccount(account)).thenReturn(mockUser);

        // 调用要测试的方法
		IdentityService identityService = new IdentityService(mockRepository);
        Identity identity = identityService.getIdentityByAccount(account);

        // 验证结果
        assertEquals("admin", identity.getPassword(), "Identity should be 'admin' for account 'testUser'");

        // 验证 repository 方法是否被调用
        Mockito.verify(mockRepository).findByAccount(account);
	}

	@Test
	public void getAccountAllTest(){
		Identity identity = identityRepository.findByAccount("taiyehu");
		System.out.println(identity);
	}

}
