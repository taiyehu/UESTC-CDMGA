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
          this.loading = true;
          this.axios({
            url: "http://localhost:8080/api/identity/login",
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            data: {
              account: this.ruleForm.account,
              password: this.ruleForm.password,
            },
          })
            .then((res) => {
              this.loading = false;
              if (res.data.code === 0) {
                sessionStorage.setItem("userInfo", JSON.stringify(res.data.data));
                this.$router.push('/home');
                this.$message({
                  message: res.data.msg || '登录成功',
                  type: "success",
                });
              } else {
                this.$message({
                  message: res.data.msg || '登录失败',
                  type: "warning",
                });
              }
            })
            .catch((error) => {
              this.loading = false;
              console.error("Request failed:", error);
              this.$message({
                message: error.response ? error.response.data.message : "登录请求失败，请稍后再试。",
                type: "error",
              });
            });
        } else {
          console.log("表单验证失败！");
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
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