import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { createForumPost, fetchForumPage, type ForumPost } from '../api'

function fmt(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN')
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const data = await fetchForumPage(nextPage, 10)
      setPosts(data.list)
      setTotal(data.total)
      setPage(nextPage)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(0) }, [])

  async function publish() {
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createForumPost(title.trim(), content.trim())
      setTitle('')
      setContent('')
      setShowEditor(false)
      await load(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发帖失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="FORUM" subtitle="社团大厅" actions={<button className="page-btn primary" type="button" onClick={() => setShowEditor((v) => !v)}>{showEditor ? '收起' : '发帖'}</button>}>
      {showEditor && (
        <div className="page-card editor">
          <input className="page-input" placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="page-input area" placeholder="说点什么…" value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="page-actions-row"><button className="page-btn primary" type="button" disabled={submitting} onClick={publish}>{submitting ? '发布中…' : '发布'}</button></div>
        </div>
      )}
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !posts.length && <div className="page-card">暂无帖子，等你开第一贴。</div>}
      <div className="forum-list">
        {posts.map((post) => (
          <Link className="page-card forum-row" key={post.id} to={`/forum/${post.id}`}>
            <div>
              <h3>{post.title}</h3>
              <p className="meta">{post.authorName} · {fmt(post.createdAt)} · {post.replyCount} 回复</p>
            </div>
            <span>→</span>
          </Link>
        ))}
      </div>
      {total > 10 && (
        <div className="page-pager">
          <button className="page-btn" disabled={page === 0} onClick={() => void load(page - 1)}>上一页</button>
          <span>{page + 1} / {Math.ceil(total / 10)}</span>
          <button className="page-btn" disabled={(page + 1) * 10 >= total} onClick={() => void load(page + 1)}>下一页</button>
        </div>
      )}
    </PageShell>
  )
}
