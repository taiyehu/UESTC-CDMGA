<template>
  <div>
    <el-card class="box-card">
      <h2>注册</h2>
      <el-form
        :model="ruleForm"
        status-icon
        :rules="rules"
        ref="ruleForm"
        label-position="left"
        label-width="80px"
        class="demo-ruleForm"
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
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            type="password"
            v-model="ruleForm.confirmPassword"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div class="btnGroup">
        <el-button
          type="primary"
          @click="submitForm('ruleForm')"
          :loading="loading"
        >提交</el-button>
        <el-button @click="resetForm('ruleForm')">重置</el-button>
        <router-link to="/login">
          <el-button>返回</el-button>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    var validatePass = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请输入密码"));
      } else if (value.length < 6) {
        callback(new Error("密码长度不能少于6位"));
      } else {
        if (this.ruleForm.confirmPassword !== "") {
          this.$refs.ruleForm.validateField("confirmPassword");
        }
        callback();
      }
    };

    var validatePass2 = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (value !== this.ruleForm.password) {
        callback(new Error("两次输入密码不一致!"));
      } else {
        callback();
      }
    };

    return {
      loading: false,
      ruleForm: {
        account: "",
        password: "",
        confirmPassword: ""
      },
      rules: {
        account: [
          { required: true, message: "用户名不能为空！", trigger: "blur" },
          { min: 3, max: 16, message: "用户名长度在3到16个字符", trigger: "blur" }
        ],
        password: [
          { required: true, validator: validatePass, trigger: "blur" }
        ],
        confirmPassword: [
          { required: true, validator: validatePass2, trigger: "blur" }
        ],
      },
    };
  },
  methods: {
    async submitForm(formName) {
      try {
        const valid = await this.$refs[formName].validate();
        if (!valid) return;

        this.loading = true;

        // 调用提取的API方法
        const response = await register({
          account: this.ruleForm.account,
          password: this.ruleForm.password
        });

        this.handleRegistrationResponse(response);
      } catch (error) {
        this.handleRegistrationError(error);
      } finally {
        this.loading = false;
      }
    },

    handleRegistrationResponse(response) {
      if (response.data.code === 0) {
        this.$message({
          message: "注册成功，请登录",
          type: "success",
          duration: 2000
        });
        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } else {
        this.$message({
          message: response.data.msg || "注册失败",
          type: "error",
          duration: 3000
        });
      }
    },

    handleRegistrationError(error) {
      console.error("注册请求失败:", error);

      let errorMessage = "注册请求失败，请稍后再试";
      if (error.response) {// 优先获取后端返回的错误信息
        errorMessage = error.response.data.message ||
            error.response.data.msg ||
            errorMessage;
      }

      this.$message({
        message: errorMessage,
        type: "error",
        duration: 3000
      });
    },

    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  },
};
</script>

<style scoped>
.box-card {
  margin: 20px auto;
  width: 400px;
}

.btnGroup {
  display: flex;
  justify-content: center;
}

.btnGroup > * {
  margin: 0 5px;
}
</style>
