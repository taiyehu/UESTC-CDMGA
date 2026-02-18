<template>
  <div>
    <el-card class="box-card">
      <h2>登录</h2>
      <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleFormRef"
        label-position="left"
        label-width="70px"
        class="login-form"
        @keyup.enter.native="submitForm"
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
        <el-button
          type="primary"
          :loading="loading"
          @click="submitForm"
        >
          登录
        </el-button>
        <el-button @click="resetForm">重置</el-button>
        <router-link to="/register">
          <el-button style="margin-left: 10px">注册</el-button>
        </router-link>
      </div>
    </el-card>
  </div>
</template>


<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'

const router = useRouter()
const ruleFormRef = ref()
const loading = ref(false)

const ruleForm = reactive({
  account: '',
  password: '',
})

const rules = reactive({
  account: [{ required: true, message: '用户名不能为空！', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空！', trigger: 'blur' }],
})

// 提交表单
const submitForm = () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      const response = await login({
        account: ruleForm.account,
        password: ruleForm.password,
      })
      handleLoginSuccess(response)
    } catch (error: any) {
      handleLoginError(error)
    } finally {
      loading.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  ruleFormRef.value.resetFields()
}

// 登录成功处理
const handleLoginSuccess = (response: any) => {
  if (response.data.code === 0) {
    sessionStorage.setItem('userInfo', JSON.stringify(response.data.data))
    sessionStorage.setItem('role', JSON.stringify(response.data.data.role))
    router.push('/home')
    ElMessage.success(response.data.msg || '登录成功')
  } else {
    ElMessage.warning(response.data.msg || '登录失败')
  }
}

// 登录失败处理
const handleLoginError = (error: any) => {
  console.error('Request failed:', error)
  let errorMessage = '登录请求失败，请稍后再试。'
  if (error.response) {
    errorMessage =
      error.response.data.message ||
      error.response.data.msg ||
      error.response.statusText
  } else if (error.request) {
    errorMessage = '无法连接到服务器，请检查网络连接'
  } else {
    errorMessage = error.message || error.toString()
  }
  ElMessage.error(errorMessage)
}
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 400px;
}
.login-form {
  margin: auto;
}
.btnGroup {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
