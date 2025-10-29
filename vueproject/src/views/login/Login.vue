<template>
  <div>
    <el-card class="box-card">
      <h2>登录</h2>
      <el-form
        :model="ruleForm"
        status-icon
        :rules="rules"
        ref="ruleForm"
        label-position="left"
        label-width="70px"
        class="login-from"
        @keyup.enter.native="submitForm('ruleForm')"
      >
        <el-form-item label="用户名" prop="account">
          <el-input v-model="ruleForm.account"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            type="password"
            v-model="ruleForm.password"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div class="btnGroup">
        <el-button type="primary" @click="submitForm('ruleForm')" :loading="loading"
          >登录</el-button
        >
        <el-button @click="resetForm('ruleForm')">重置</el-button>
        <router-link to="/register">
          <el-button style="margin-left:10px">注册</el-button>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
import {login} from "@/api/auth"

export default {
  data() {
    return {
      ruleForm: {
        account: "",
        password: "",
      },
      loading: false, // Add loading state
      rules: {
        account: [
          { required: true, message: "用户名不能为空！", trigger: "blur" },
        ],
        password: [
          { required: true, message: "密码不能为空！", trigger: "blur" },
        ],
      },
    };
  },
  methods: {
    submitForm(formName) {
    this.$refs[formName].validate((valid) => {
      if (valid) {
        console.log("表单验证成功");
        this.handleLogin();
      } else {
        console.log("表单验证失败！");
        return false;
      }
      });
    },
    async handleLogin(){
      this.loading = true;

      try {
        // 调用 API 文件中的登录方法
        const response = await login({
          account: this.ruleForm.account,
          password: this.ruleForm.password
        });

        this.handleLoginSuccess(response);
      } catch (error) {
        this.handleLoginError(error);
      } finally {
        this.loading = false;
      }
    },
    handleLoginSuccess(response) {
      if (response.data.code === 0) {
        sessionStorage.setItem("userInfo", JSON.stringify(response.data.data));
        sessionStorage.setItem("role", JSON.stringify(response.data.data.role));

        this.$router.push('/home');
        this.$message({
          message: response.data.msg || '登录成功',
          type: "success",
        });
      } else {
        this.$message({
          message: response.data.msg || '登录失败',
          type: "warning",
        });
      }
    },
    handleLoginError(error) {
      console.error("Request failed:", error);

      let errorMessage = "登录请求失败，请稍后再试。";
      if (error.response) {
        // 优先使用后端返回的错误信息
        errorMessage = error.response.data.message ||
            error.response.data.msg ||
            error.response.statusText;
      } else if (error.request) {
        errorMessage = "无法连接到服务器，请检查网络连接";
      } else {
        errorMessage = error.message || error.toString();
      }

      this.$message({
        message: errorMessage,
        type: "error",
      });
    }

  },
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 400px;
}
.login-from {
  margin: auto;
}
</style>
