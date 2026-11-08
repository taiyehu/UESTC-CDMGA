import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchMail, mailTarget, readMail, type Mail, type MailCategory } from '../mail'
import './MailPage.css'

const categories: { key: MailCategory; label: string; icon: string }[] = [
  { key: 'all', label: '全部消息', icon: '✉' },
  { key: 'replies', label: '回复我的', icon: '↩' },
  { key: 'likes', label: '收到的赞', icon: '♥' },
  { key: 'system', label: '系统通知', icon: '✦' },
  { key: 'review', label: '审核与举报', icon: '!' },
]

function mailIcon(kind: string) {
  if (kind === 'forum_reply') return '↩'
  if (kind === 'forum_like') return '♥'
  if (kind.includes('published')) return '✦'
  return '!'
}

export default function MailPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<MailCategory>('all')
  const [rows, setRows] = useState<Mail[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    void fetchMail(page, category).then((result) => {
      if (active) { setRows(result.list); setTotal(result.total); setError('') }
    }).catch((e) => {
      if (active) setError(e instanceof Error ? e.message : '信箱加载失败')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, category])

  async function open(mail: Mail) {
    try {
      if (!mail.readAt) {
        await readMail(mail.id)
        setRows((items) => items.map((item) => item.id === mail.id ? { ...item, readAt: new Date().toISOString() } : item))
      }
      const target = mailTarget(mail)
      if (target) navigate(target)
    } catch (e) { setError(e instanceof Error ? e.message : '标记已读失败') }
  }

  function selectCategory(next: MailCategory) { setCategory(next); setPage(0) }
  const activeCategory = categories.find((item) => item.key === category) ?? categories[0]

  return <PageShell wide hideHead>
    <div className="mail-center">
      <aside className="mail-sidebar" aria-label="信箱分类">
        <div className="mail-sidebar-title">消息中心</div>
        <nav>{categories.map((item) => <button key={item.key} type="button" className={category === item.key ? 'active' : ''} onClick={() => selectCategory(item.key)}><span className="mail-nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
      </aside>
      <section className="mail-panel" aria-label={activeCategory.label}>
        <div className="mail-panel-head"><div><span className="mail-eyebrow">INBOX</span><h1>{activeCategory.label}</h1></div><span className="mail-total">共 {total} 条</span></div>
        {error && <div className="mail-feedback error">{error}</div>}
        {loading && <div className="mail-feedback">加载中…</div>}
        {!loading && rows.length === 0 && <div className="mail-empty"><span aria-hidden="true">✉</span><strong>这里还没有消息</strong><p>有新动态时会显示在这里</p></div>}
        {!loading && <div className="mail-timeline">{rows.map((mail) => <button type="button" key={mail.id} className={`mail-entry${mail.readAt ? '' : ' unread'}`} onClick={() => void open(mail)}>
          <span className="mail-entry-icon" aria-hidden="true">{mailIcon(mail.kind)}</span>
          <span className="mail-entry-main"><span className="mail-entry-top"><strong>{mail.title}</strong><time>{new Date(mail.createdAt).toLocaleString('zh-CN')}</time></span><span className="mail-entry-content">{mail.content}</span>{mailTarget(mail) && <span className="mail-entry-link">查看相关内容 →</span>}</span>
          {!mail.readAt && <span className="mail-entry-dot" aria-label="未读" />}
        </button>)}</div>}
        {total > 20 && <div className="mail-pager"><button className="page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</button><span>{page + 1} / {Math.ceil(total / 20)}</span><button className="page-btn" disabled={(page + 1) * 20 >= total} onClick={() => setPage(page + 1)}>下一页</button></div>}
      </section>
    </div>
  </PageShell>
}
