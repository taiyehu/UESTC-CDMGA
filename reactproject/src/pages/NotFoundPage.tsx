import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="login-page">
      <div className="bg" aria-hidden="true" />
      <section className="login-card notfound">
        <div className="notfound-code">404</div>
        <h1>页面不存在</h1>
        <p className="login-sub">当前路由无效。</p>
        <div className="login-actions"><Link className="primary" to="/home">返回首页</Link></div>
      </section>
    </main>
  )
}
