import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { createForumReply, fetchForumPost, type ForumPostDetail } from '../api'

export default function ForumPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<ForumPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    const postId = Number(id)
    if (!Number.isFinite(postId)) { setError('帖子编号无效'); setLoading(false); return }
    setLoading(true)
    try {
      setPost(await fetchForumPost(postId))
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  async function sendReply() {
    const postId = Number(id)
    if (!reply.trim() || !postId) return
    setSending(true)
    setError('')
    try {
      await createForumReply(postId, reply.trim())
      setReply('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '回复失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <PageShell title="POST" subtitle={post?.title}>
      <div className="page-actions-row"><Link className="page-btn" to="/forum">← 返回论坛</Link></div>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !post && <div className="page-card">帖子不存在</div>}
      {post && (
        <>
          <article className="page-card post-detail">
            <div className="card-k">{post.authorName} · {new Date(post.createdAt).toLocaleString('zh-CN')}</div>
            <h2>{post.title}</h2>
            <p className="post-content">{post.content}</p>
          </article>
          <section className="section-block">
            <h2>回复 {post.replies?.length ?? 0}</h2>
            <div className="forum-list">
              {(post.replies ?? []).map((r) => (
                <div className="page-card forum-row" key={r.id}>
                  <div><h3>{r.authorName}</h3><p className="post-content">{r.content}</p></div>
                  <span className="meta">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
            <div className="page-card editor">
              <textarea className="page-input area" placeholder="写回复…" value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="page-actions-row"><button className="page-btn primary" type="button" disabled={sending} onClick={sendReply}>{sending ? '发送中…' : '回复'}</button></div>
            </div>
          </section>
        </>
      )}
    </PageShell>
  )
}
