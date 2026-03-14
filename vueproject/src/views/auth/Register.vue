<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-5 pt-7 pb-11 max-[820px]:min-h-[calc(100vh-48px)] max-[820px]:px-3.5 max-[820px]:pt-4 max-[820px]:pb-6">
    <div class="w-full max-w-235 grid grid-cols-[1.05fr_0.95fr] gap-5.5 max-[820px]:grid-cols-1 max-[820px]:gap-3.5">
      <section
        class="text-left text-[#e5f4ff] rounded-[20px] border border-[rgba(125,219,255,0.22)] p-[32px_30px] shadow-[0_24px_64px_rgba(2,6,23,0.45)] bg-[radial-gradient(circle_at_82%_0%,rgba(66,188,255,0.24),transparent_48%),radial-gradient(circle_at_0%_100%,rgba(138,167,255,0.2),transparent_52%),linear-gradient(155deg,rgba(4,18,36,0.78),rgba(9,21,52,0.54))] max-[820px]:p-[22px_18px]"
      >
        <p class="m-0 text-[12px] tracking-[0.18em] text-[rgba(211,237,255,0.86)]">UESTC · CDMGA</p>
        <h1 class="mt-3.5 mb-2.5 text-[clamp(28px,4.4vw,44px)] leading-[1.08] text-[#f8fdff] max-[820px]:mt-2.5">创建账户</h1>
        <p class="m-0 text-[15px] leading-[1.75] text-[rgba(224,244,255,0.9)]">
          完成注册后即可登录参与活动、课题打分与排行榜。
        </p>
      </section>

      <section
        class="text-left rounded-[20px] border border-[rgba(132,213,255,0.24)] p-[28px_24px_22px] shadow-[0_22px_56px_rgba(2,6,23,0.5)] backdrop-blur-sm bg-[linear-gradient(180deg,rgba(8,23,44,0.82),rgba(5,14,28,0.9))] max-[820px]:p-[22px_16px_16px]"
      >
        <h2 class="m-0 text-[26px] text-[#f2f8ff]">注册</h2>
        <p class="mt-2 mb-4.5 text-[13px] text-[rgba(201,225,242,0.82)]">请填写账号和密码信息</p>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          status-icon
          :rules="rules"
          label-position="top"
          class="auth-form"
          @keyup.enter="submitForm"
        >
          <el-form-item label="用户名" prop="account">
            <el-input v-model="ruleForm.account" placeholder="3-16位用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="ruleForm.password"
              type="password"
              autocomplete="off"
              show-password
              placeholder="不少于6位"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="ruleForm.confirmPassword"
              type="password"
              autocomplete="off"
              show-password
              placeholder="再次输入密码"
            />
          </el-form-item>
        </el-form>

        <div class="auth-buttons mt-1 flex gap-2.5">
          <el-button type="primary" :loading="loading" @click="submitForm">
            提交
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </div>

        <p class="mt-4 mb-0 text-center text-[13px] text-[rgba(193,222,247,0.86)]">
          已有账号？
          <router-link
            to="/login"
            class="font-semibold text-[#72d7ff] no-underline hover:text-[#9ee9ff]"
          >
            返回登录
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
import type { FormInstance } from 'element-plus'
import { register } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const ruleForm = reactive({ account: '', password: '', confirmPassword: '' })
const ruleFormRef = ref<FormInstance | null>(null)

const validatePass = (value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    if (ruleForm.confirmPassword !== '') {
      ruleFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== ruleForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  account: [
    { required: true, message: '用户名不能为空！', trigger: 'blur' },
    { min: 3, max: 16, message: '用户名长度在3到16个字符', trigger: 'blur' },
  ],
  password: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
}

async function submitForm() {
  try {
    // Element Plus validate 返回 Promise，validate() 会在校验失败时抛出
    await ruleFormRef.value?.validate()
    loading.value = true
    const response = await register({ account: ruleForm.account, password: ruleForm.password })
    if (response.data && response.data.code === 0) {
      ElMessage({ message: '注册成功，请登录', type: 'success', duration: 2000 })
      setTimeout(() => router.push('/login'), 1500)
    } else {
      ElMessage({ message: response.data?.msg || '注册失败', type: 'error', duration: 3000 })
    }
  } catch (error: any) {
    // validate 会抛出错误或 register 请求抛出错误
    if (error && error instanceof Error && /validate/i.test(error.message)) {
      // 表单校验错误，已由组件显示，不需要额外处理
    } else {
      const errMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '注册请求失败，请稍后再试'
      ElMessage({ message: errMsg, type: 'error', duration: 3000 })
    }
  } finally {
    loading.value = false
  }
}

function resetForm() {
  ruleFormRef.value?.resetFields()
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
  color: #ebf5ff;
}

.auth-form :deep(.el-input__inner:-webkit-autofill),
.auth-form :deep(.el-input__inner:-webkit-autofill:hover),
.auth-form :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-text-fill-color: #ebf5ff;
  -webkit-box-shadow: 0 0 0px 1000px rgba(11, 42, 78, 0.84) inset;
  box-shadow: 0 0 0px 1000px rgba(11, 42, 78, 0.84) inset;
  transition: background-color 9999s ease-out 0s;
}

.auth-form :deep(.el-input__inner::placeholder) {
  color: rgba(181, 213, 238, 0.66);
}

.auth-buttons :deep(.el-button) {
  flex: 1;
  border-radius: 12px;
}

.auth-buttons :deep(.el-button--primary) {
  border-color: rgba(113, 205, 255, 0.45);
  background: linear-gradient(120deg, #1d7bff, #36ccff);
}
</style>
