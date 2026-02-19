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
          @click="submitForm()"
          :loading="loading"
          >提交</el-button
        >
        <el-button @click="resetForm()">重置</el-button>
        <router-link to="/login">
          <el-button>返回</el-button>
        </router-link>
      </div>
    </el-card>
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
