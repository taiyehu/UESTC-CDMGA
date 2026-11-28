import './AuthLoadingPage.css'

export default function AuthLoadingPage({ error = false, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <main className="auth-loading-page">
      <div className="bg" aria-hidden="true" />
      <section className="auth-loading-card" role={error ? 'alert' : 'status'} aria-live="polite">
        <div className="auth-loading-brand">
          <img src="/club-logo.jpg" alt="" />
          <span>UESTC CDMGA</span>
        </div>
        <div className="auth-loading-indicator" aria-hidden="true"><span /></div>
        <h1>{error ? '暂时无法验证登录状态' : '正在进入页面'}</h1>
        <p>{error ? '连接暂时不可用，请稍后重试。' : '正在确认登录状态，请稍候…'}</p>
        {error && <button type="button" onClick={onRetry}>重试</button>}
      </section>
    </main>
  )
}
