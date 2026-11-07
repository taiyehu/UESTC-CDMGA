import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function LoginPage() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!account || !password) {
      setError('用户名和密码不能为空')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await login(account, password)
      const { password: _pw, ...safe } = data ?? {}
      sessionStorage.setItem('userInfo', JSON.stringify(safe))
      sessionStorage.setItem('role', JSON.stringify(safe.role ?? 'user'))
      navigate('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setAccount('')
    setPassword('')
    setError('')
  }

  return (
    <main className="login-page">
      <div className="bg" aria-hidden="true" />
      <header className="login-top">
        <Link className="brand" to="/">
          <img src="/club-logo.jpg" alt="" className="brand-mark" />
          <span><b>UESTC CDMGA</b><em>MAIMAI CLUB · 2026</em></span>
        </Link>
        <div className="login-chips"><Link to="/">返回首页</Link></div>
      </header>

      <section className="login-card">
        <div className="login-brand">
          <img src="/club-logo.jpg" alt="CDMGA" />
          <div><b>UESTC CDMGA</b><span>ARCADE STAGE · 2026</span></div>
        </div>
        <h1>登录</h1>
        <form onSubmit={onSubmit} className="login-form">
          <label htmlFor="account">用户名</label>
          <input
            id="account"
            name="account"
            placeholder="请输入用户名"
            autoComplete="username"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <label htmlFor="password">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="请输入密码"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-actions">
            <button className="primary" type="submit" disabled={loading}>{loading ? '登录中…' : '登录'}</button>
            <button className="secondary" type="button" onClick={reset} disabled={loading}>重置</button>
          </div>
        </form>
        <p className="login-alt">没有账号？<Link to="/register">立即注册</Link></p>
      </section>
    </main>
  )
}
