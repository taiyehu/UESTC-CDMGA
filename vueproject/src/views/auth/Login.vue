<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-5 pt-7 pb-11 max-[820px]:min-h-[calc(100vh-48px)] max-[820px]:px-3.5 max-[820px]:pt-4 max-[820px]:pb-6">
    <div class="w-full max-w-235 grid grid-cols-[1.05fr_0.95fr] gap-5.5 max-[820px]:grid-cols-1 max-[820px]:gap-3.5">
      <section
        class="text-left text-[#e5f4ff] rounded-[20px] border border-[rgba(120,207,255,0.2)] p-[32px_30px] shadow-[0_24px_64px_rgba(2,6,23,0.45)] bg-[radial-gradient(circle_at_90%_0%,rgba(54,182,255,0.24),transparent_48%),radial-gradient(circle_at_0%_100%,rgba(176,132,255,0.18),transparent_50%),linear-gradient(155deg,rgba(3,14,31,0.78),rgba(6,24,44,0.56))] max-[820px]:p-[22px_18px]"
      >
        <p class="m-0 text-[12px] tracking-[0.18em] text-[rgba(207,236,255,0.86)]">UESTC · CDMGA</p>
        <h1 class="mt-3.5 mb-2.5 text-[clamp(28px,4.4vw,44px)] leading-[1.08] text-[#f8fdff] max-[820px]:mt-2.5">欢迎回来</h1>
        <p class="m-0 text-[15px] leading-[1.75] text-[rgba(223,243,255,0.88)]">
          登录后即可继续参与课题、活动与成绩提交。
        </p>
      </section>

      <section
        class="text-left rounded-[20px] border border-[rgba(128,212,255,0.24)] p-[28px_24px_22px] shadow-[0_22px_56px_rgba(2,6,23,0.5)] backdrop-blur-sm bg-[linear-gradient(180deg,rgba(7,20,40,0.82),rgba(5,14,28,0.88))] max-[820px]:p-[22px_16px_16px]"
      >
        <h2 class="m-0 text-[26px] text-[#f2f8ff]">登录</h2>
        <p class="mt-2 mb-4.5 text-[13px] text-[rgba(199,224,242,0.82)]">输入账号信息以进入系统</p>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          :rules="rules"
          label-position="top"
          class="auth-form"
          @keyup.enter="submitForm"
        >
          <el-form-item label="用户名" prop="account">
            <el-input v-model="ruleForm.account" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="ruleForm.password"
              type="password"
              autocomplete="off"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
        </el-form>

        <div class="auth-buttons mt-1 flex gap-2.5">
          <NeonActionButton class="flex-1" variant="auth-primary" :loading="loading" @click="submitForm">
            登录
          </NeonActionButton>
          <NeonActionButton class="flex-1" variant="auth-secondary" :disabled="loading" @click="resetForm">重置</NeonActionButton>
        </div>

        <p class="mt-4 mb-0 text-center text-[13px] text-[rgba(193,222,247,0.86)]">
          没有账号？
          <router-link
            to="/register"
            class="font-semibold text-[#72d7ff] no-underline hover:text-[#9ee9ff]"
          >
            立即注册
          </router-link>
        </p>
      </section>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import NeonActionButton from '@/components/NeonActionButton.vue'

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
.auth-form :deep(.el-form-item__label) {
  color: rgba(220, 239, 255, 0.9);
}

.auth-form :deep(.el-input__wrapper) {
  background: rgba(10, 35, 66, 0.75);
  box-shadow: inset 0 0 0 1px rgba(112, 196, 242, 0.24);
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.auth-form :deep(.el-input__wrapper:hover) {
  background: rgba(11, 40, 74, 0.8);
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  background: rgba(11, 42, 78, 0.84);
  box-shadow:
    inset 0 0 0 1px rgba(102, 208, 255, 0.56),
    0 0 0 3px rgba(64, 188, 255, 0.18);
}

.auth-form :deep(.el-input__inner) {
  color: #e9f4ff;
}

.auth-form :deep(.el-input__inner:-webkit-autofill),
.auth-form :deep(.el-input__inner:-webkit-autofill:hover),
.auth-form :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-text-fill-color: #e9f4ff;
  -webkit-box-shadow: 0 0 0px 1000px rgba(11, 42, 78, 0.84) inset;
  box-shadow: 0 0 0px 1000px rgba(11, 42, 78, 0.84) inset;
  transition: background-color 9999s ease-out 0s;
}

.auth-form :deep(.el-input__inner::placeholder) {
  color: rgba(181, 213, 238, 0.66);
}

</style>
