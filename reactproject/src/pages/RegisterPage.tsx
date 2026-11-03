import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api'

export default function RegisterPage() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (account.length < 3 || account.length > 16) return setError('用户名需为 3-16 位')
    if (password.length < 6) return setError('密码长度不能少于 6 位')
    if (password !== confirm) return setError('两次输入的密码不一致')
    setLoading(true)
    setError('')
    try {
      await register(account, password)
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="bg" aria-hidden="true" />
      <header className="login-top">
        <Link className="brand" to="/">
          <img src="/club-logo.jpg" alt="" className="brand-mark" />
          <span><b>UESTC CDMGA</b><em>MAIMAI CLUB · 2026</em></span>
        </Link>
        <div className="login-chips"><Link to="/login">返回登录</Link></div>
      </header>
      <section className="login-card">
        <div className="login-brand"><img src="/club-logo.jpg" alt="CDMGA" /><div><b>UESTC CDMGA</b><span>ARCADE STAGE · 2026</span></div></div>
        <h1>创建账户</h1>
        <p className="login-sub">完成注册后即可登录参与活动、课题打分与排行榜。</p>
        <form onSubmit={onSubmit} className="login-form">
          <label htmlFor="account">用户名</label>
          <input id="account" placeholder="3-16位用户名" value={account} onChange={(e) => setAccount(e.target.value)} />
          <label htmlFor="password">密码</label>
          <input id="password" type="password" placeholder="不少于6位" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="confirm">确认密码</label>
          <input id="confirm" type="password" placeholder="再次输入密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-actions">
            <button className="primary" type="submit" disabled={loading}>{loading ? '提交中…' : '提交'}</button>
            <button className="secondary" type="button" onClick={() => { setAccount(''); setPassword(''); setConfirm(''); setError('') }}>重置</button>
          </div>
        </form>
        <p className="login-alt">已有账号？<Link to="/login">返回登录</Link></p>
      </section>
    </main>
  )
}
